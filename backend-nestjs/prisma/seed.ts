import { PrismaClient, Prisma, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  encryptSensitive,
  decryptSensitive,
  hashForLookup,
} from '../src/common/encryption/sensitive-data.encryption';

const prisma = new PrismaClient();

const SALT_ROUNDS = 14;

// Encryption key for sensitive data (account numbers). Must match ENCRYPTION_KEY used by the app.
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  '0000000000000000000000000000000000000000000000000000000000000001';

// ---------------------------------------------------------------------------
// Seed data: Account Management by role (Admin, Employee, Customer)
// Passwords: hashed with bcrypt (never stored in plaintext). Common password: 12345@aA
// Account numbers: encrypted at rest (AES-256-GCM); lookup by hash.
// ---------------------------------------------------------------------------

const SEED_PASSWORD = '12345@aA';

const ADMIN_USERS = [
  {
    email: 'admin@gmail.com',
    password: SEED_PASSWORD,
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
  },
];

const EMPLOYEE_USERS = [
  {
    email: 'employee@gmail.com',
    password: SEED_PASSWORD,
    firstName: 'Employee',
    lastName: 'User',
    role: 'EMPLOYEE' as const,
  },
];

const CUSTOMER_USERS = [
  {
    email: 'customer@gmail.com',
    password: SEED_PASSWORD,
    firstName: 'Customer',
    lastName: 'User',
    role: 'CUSTOMER' as const,
  },
];

function generateAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ACCT${timestamp}${random}`;
}

function generateReferenceNumber(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function createOrUpdateUser(
  userData: (typeof ADMIN_USERS)[0] | (typeof EMPLOYEE_USERS)[0] | (typeof CUSTOMER_USERS)[0]
) {
  const existingUser = await prisma.user.findFirst({
    where: { email: userData.email, deletedAt: null },
  });

  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
  const data = {
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role as any,
    verified: true,
    isForgetPassword: false,
    loginSource: 'default',
    mfaEnabled: false,
    failedOtpAttempts: 0,
    logoutPin: '',
    deletedAt: null,
  } as any;

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { ...data, email: userData.email },
    });
    console.log(`  ✓ Updated user: ${userData.email} (${userData.role})`);
    return existingUser.id;
  }

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      ...data,
    },
  });
  console.log(`  ✓ Created user: ${userData.email} (${userData.role})`);
  return user.id;
}

async function ensureCustomerAccount(
  userId: number,
  type: 'CHECKING' | 'SAVINGS' | 'LOAN',
  currency: string,
  options?: {
    interestRate?: number;
    minimumBalance?: number;
    loanAmount?: number;
    loanTermMonths?: number;
    initialBalance?: number;
  }
): Promise<{ id: number; accountNumber: string; created: boolean } | null> {
  if (ENCRYPTION_KEY.length !== 64 || !/^[0-9a-fA-F]+$/.test(ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters. Use same key as the app (or leave unset in dev to use default).');
  }

  const existing = await prisma.account.findFirst({
    where: { userId, type: type as any, deletedAt: null },
  });
  if (existing) {
    const plainNumber = decryptSensitive(existing.accountNumber, ENCRYPTION_KEY);
    console.log(`  (skip) Customer already has ${type} account: ${plainNumber}`);
    return { id: existing.id, accountNumber: plainNumber, created: false };
  }

  const accountNumberPlain = generateAccountNumber();
  const accountNumber = encryptSensitive(accountNumberPlain, ENCRYPTION_KEY);
  const accountNumberHash = hashForLookup(accountNumberPlain, ENCRYPTION_KEY);

  let loanStartDate: Date | null = null;
  let loanEndDate: Date | null = null;
  let monthlyPayment: Prisma.Decimal | null = null;

  if (type === 'LOAN' && options?.loanAmount && options?.loanTermMonths) {
    loanStartDate = new Date();
    loanEndDate = new Date();
    loanEndDate.setMonth(loanEndDate.getMonth() + options.loanTermMonths);
    monthlyPayment = new Prisma.Decimal(options.loanAmount / options.loanTermMonths);
  }

  const initialBalance = options?.initialBalance ?? 0;

  // Real-world: daily limit and transfer fees (optional per account type)
  const dailyWithdrawalLimit = type === 'LOAN' ? null : 5000; // e.g. 5000 USD/day for checking/savings
  const transferFeePercent = type === 'LOAN' ? null : 0.5;   // 0.5%
  const transferFeeFixed = type === 'LOAN' ? null : 1.5;     // 1.5 fixed per transfer

  const account = await prisma.account.create({
    data: {
      accountNumber,
      accountNumberHash,
      userId,
      type: type as any,
      currency: currency as any,
      balance: new Prisma.Decimal(initialBalance),
      availableBalance: new Prisma.Decimal(initialBalance),
      status: 'ACTIVE',
      interestRate: options?.interestRate ? new Prisma.Decimal(options.interestRate) : null,
      minimumBalance: options?.minimumBalance ? new Prisma.Decimal(options.minimumBalance) : null,
      loanAmount: options?.loanAmount ? new Prisma.Decimal(options.loanAmount) : null,
      loanTermMonths: options?.loanTermMonths ?? null,
      loanStartDate,
      loanEndDate,
      monthlyPayment,
      dailyWithdrawalLimit: dailyWithdrawalLimit != null ? new Prisma.Decimal(dailyWithdrawalLimit) : null,
      transferFeePercent: transferFeePercent != null ? new Prisma.Decimal(transferFeePercent) : null,
      transferFeeFixed: transferFeeFixed != null ? new Prisma.Decimal(transferFeeFixed) : null,
      deletedAt: null,
    } as any,
  });

  console.log(`  ✓ Created ${type} account: ${accountNumberPlain} (Balance: ${initialBalance} ${currency})`);
  return { id: account.id, accountNumber: accountNumberPlain, created: true };
}

async function addTransaction(
  accountId: number,
  type: TransactionType,
  amount: number,
  balanceAfter: number,
  description: string
) {
  const ref = generateReferenceNumber();
  await prisma.transaction.create({
    data: {
      accountId,
      type,
      amount: new Prisma.Decimal(amount),
      balanceAfter: new Prisma.Decimal(balanceAfter),
      description,
      referenceNumber: ref,
    } as any,
  });
}

async function main() {
  console.log('🌱 Seed: Account Management (Admin, Employee, Customer)\n');
  if (!process.env.ENCRYPTION_KEY) {
    console.log('ℹ Using default encryption key for seed. Set ENCRYPTION_KEY (64 hex) in production.\n');
  }

  const userIds: Record<string, number> = {};

  // 1. Admins (full access)
  console.log('👤 Admins');
  for (const u of ADMIN_USERS) {
    userIds[u.email] = await createOrUpdateUser(u);
  }

  // 2. Employees (create/manage customer accounts)
  console.log('\n👤 Employees');
  for (const u of EMPLOYEE_USERS) {
    userIds[u.email] = await createOrUpdateUser(u);
  }

  // 3. Customers (own accounts; accounts created by staff)
  console.log('\n👤 Customers');
  for (const u of CUSTOMER_USERS) {
    userIds[u.email] = await createOrUpdateUser(u);
  }

  // 3b. Admin and Employee must have NO accounts (only customers have accounts)
  const staffUsers = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'EMPLOYEE'] }, deletedAt: null },
    select: { id: true },
  });
  const staffIds = staffUsers.map((u) => u.id);
  if (staffIds.length > 0) {
    const deleted = await prisma.account.deleteMany({
      where: { userId: { in: staffIds } },
    });
    if (deleted.count > 0) {
      console.log(`\n🗑 Removed ${deleted.count} account(s) from Admin/Employee (only customers have accounts).`);
    }
  }

  // 4. Accounts only for customers (logical: staff create accounts for customers)
  console.log('\n📦 Customer accounts (Admin/Employee have no accounts)\n');

  for (const c of CUSTOMER_USERS) {
    const customerId = userIds[c.email];
    if (!customerId) continue;

    console.log(`Customer: ${c.email} (ID: ${customerId})`);

    const checking = await ensureCustomerAccount(customerId, 'CHECKING', 'USD', {
      minimumBalance: 100,
      initialBalance: 1500,
    });
    if (checking?.created) {
      await addTransaction(checking.id, TransactionType.DEPOSIT, 500, 500, 'Initial deposit');
      await addTransaction(checking.id, TransactionType.DEPOSIT, 1000, 1500, 'Deposit');
    }

    const savings = await ensureCustomerAccount(customerId, 'SAVINGS', 'USD', {
      interestRate: 2.5,
      minimumBalance: 500,
      initialBalance: 5000,
    });
    if (savings?.created) {
      await addTransaction(savings.id, TransactionType.DEPOSIT, 5000, 5000, 'Opening deposit');
    }

    // Sample transfer (checking -> savings) for first customer when both accounts were created this run
    if (checking?.created && savings?.created && c.email === CUSTOMER_USERS[0].email) {
      const ref = generateReferenceNumber();
      const transferAmount = 200;
      const fee = 1.5 + (transferAmount * 0.5) / 100;
      const totalDebit = transferAmount + fee;
      const checkingBalanceAfter = 1500 - totalDebit;
      const savingsBalanceAfter = 5000 + transferAmount;
      await prisma.transaction.create({
        data: {
          accountId: checking.id,
          type: TransactionType.TRANSFER_OUT,
          amount: new Prisma.Decimal(totalDebit),
          balanceAfter: new Prisma.Decimal(checkingBalanceAfter),
          description: `Transfer to ${savings.accountNumber}`,
          referenceNumber: ref,
          relatedAccountId: savings.id,
        } as any,
      });
      await prisma.transaction.create({
        data: {
          accountId: savings.id,
          type: TransactionType.TRANSFER_IN,
          amount: new Prisma.Decimal(transferAmount),
          balanceAfter: new Prisma.Decimal(savingsBalanceAfter),
          description: `Transfer from ${checking.accountNumber}`,
          referenceNumber: `${ref}-IN`,
          relatedAccountId: checking.id,
        } as any,
      });
      await prisma.account.update({
        where: { id: checking.id },
        data: {
          balance: new Prisma.Decimal(checkingBalanceAfter),
          availableBalance: new Prisma.Decimal(checkingBalanceAfter),
        } as any,
      });
      await prisma.account.update({
        where: { id: savings.id },
        data: {
          balance: new Prisma.Decimal(savingsBalanceAfter),
          availableBalance: new Prisma.Decimal(savingsBalanceAfter),
        } as any,
      });
      console.log(`  ✓ Sample transfer: ${checking.accountNumber} → ${savings.accountNumber} (${transferAmount} + fee ${fee.toFixed(2)})`);
    }

    // One pending loan application for first customer (for testing approve/reject workflow)
    if (c.email === CUSTOMER_USERS[0].email) {
      const existing = await prisma.loanApplication.findFirst({
        where: { userId: customerId, status: 'PENDING' },
      });
      if (!existing) {
        await prisma.loanApplication.create({
          data: {
            userId: customerId,
            loanType: 'PERSONAL',
            amount: new Prisma.Decimal(5000),
            termMonths: 12,
            interestRate: new Prisma.Decimal(0),
            purpose: 'Home improvement',
            currency: 'USD',
            status: 'PENDING',
            penaltyRatePercentPerMonth: new Prisma.Decimal(1),
          } as any,
        });
        console.log('  ✓ Created PENDING loan application for customer (5000 USD, 12 mo; interest set on approval)');
      }
    }

    // Savings plans (FD + RD) for first customer
    if (c.email === CUSTOMER_USERS[0].email && checking && savings) {
      const existingFd = await prisma.savingsPlan.findFirst({
        where: { userId: customerId, planType: 'FIXED_DEPOSIT', status: 'ACTIVE' },
      });
      if (!existingFd) {
        const fdPrincipal = 1000;
        const savingsRow = await prisma.account.findFirst({
          where: { id: savings.id },
        });
        const currentBalance = savingsRow ? Number(savingsRow.balance) : 5000;
        if (currentBalance >= fdPrincipal) {
          const balanceAfter = currentBalance - fdPrincipal;
          await prisma.account.update({
            where: { id: savings.id },
            data: {
              balance: new Prisma.Decimal(balanceAfter),
              availableBalance: new Prisma.Decimal(balanceAfter),
            } as any,
          });
          await addTransaction(savings.id, TransactionType.WITHDRAWAL, fdPrincipal, balanceAfter, 'Fixed deposit - Seed');
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 12);
          await prisma.savingsPlan.create({
            data: {
              userId: customerId,
              sourceAccountId: savings.id,
              planType: 'FIXED_DEPOSIT',
              currency: 'USD',
              principal: new Prisma.Decimal(fdPrincipal),
              monthlyAmount: null,
              interestRate: new Prisma.Decimal(5.5),
              termMonths: 12,
              startDate,
              endDate,
              status: 'ACTIVE',
              interestCreditedTotal: new Prisma.Decimal(0),
              totalDeposited: new Prisma.Decimal(0),
            } as any,
          });
          console.log('  ✓ Created Fixed Deposit (1000 USD, 12 mo, 5.5% p.a.) from savings account');
        }
      }

      const existingRd = await prisma.savingsPlan.findFirst({
        where: { userId: customerId, planType: 'RECURRING_DEPOSIT', status: 'ACTIVE' },
      });
      if (!existingRd) {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 12);
        const nextDue = new Date(startDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        await prisma.savingsPlan.create({
          data: {
            userId: customerId,
            sourceAccountId: checking.id,
            planType: 'RECURRING_DEPOSIT',
            currency: 'USD',
            principal: null,
            monthlyAmount: new Prisma.Decimal(100),
            interestRate: new Prisma.Decimal(5),
            termMonths: 12,
            startDate,
            endDate,
            status: 'ACTIVE',
            interestCreditedTotal: new Prisma.Decimal(0),
            totalDeposited: new Prisma.Decimal(0),
            nextDueDate: nextDue,
          } as any,
        });
        console.log('  ✓ Created Recurring Deposit (100 USD/mo, 12 mo, 5% p.a.) linked to checking');
      }
    }
  }

  console.log('\n✅ Seed completed.\n');
  console.log('📝 Credentials (all use password: 12345@aA):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nADMIN (full access; manage employees & accounts):');
  ADMIN_USERS.forEach((u) => console.log(`  ${u.email}`));
  console.log('\nEMPLOYEE (create/manage customer accounts):');
  EMPLOYEE_USERS.forEach((u) => console.log(`  ${u.email}`));
  console.log('\nCUSTOMER (has checking + savings + 1 PENDING loan + 1 FD + 1 RD):');
  CUSTOMER_USERS.forEach((u) => console.log(`  ${u.email}`));
  console.log('\nLoan: Sign in as admin → List loan applications → Approve (set interestRate) → Get schedule → Pay installment (fromAccountId = customer account ID, repaymentId from schedule).');
  console.log('\nSavings plans: Sign in as customer → List savings plans → Create FD/RD (sourceAccountId from List Accounts). Run monthly interest (Admin): POST /v1/savings-plans/run-monthly-interest.');
  console.log('\nDeposit: Admin and Employee only; customers cannot deposit.');
  console.log('\nReports: GET /v1/reports/statements/monthly (accountId, year, month), /reports/account-summary, /reports/loan-balances, /reports/transaction-history. Use accountId from List Accounts.');
  console.log('\nSecurity: Passwords hashed with bcrypt; account numbers encrypted at rest (AES-256-GCM). Set ENCRYPTION_KEY (64 hex chars) in production.');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
