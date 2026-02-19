-- CreateTable
CREATE TABLE `accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountNumber` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `type` ENUM('CHECKING', 'SAVINGS', 'LOAN') NOT NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'CNY', 'AUD', 'CAD') NOT NULL DEFAULT 'USD',
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `availableBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `interestRate` DECIMAL(5, 4) NULL,
    `minimumBalance` DECIMAL(15, 2) NULL,
    `loanAmount` DECIMAL(15, 2) NULL,
    `loanTermMonths` INTEGER NULL,
    `loanStartDate` DATETIME(3) NULL,
    `loanEndDate` DATETIME(3) NULL,
    `monthlyPayment` DECIMAL(15, 2) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `accounts_accountNumber_key`(`accountNumber`),
    INDEX `accounts_userId_idx`(`userId`),
    INDEX `accounts_accountNumber_idx`(`accountNumber`),
    INDEX `accounts_type_idx`(`type`),
    INDEX `accounts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT', 'INTEREST_CREDIT', 'FEE', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `balanceAfter` DECIMAL(15, 2) NOT NULL,
    `description` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `relatedAccountId` INTEGER NULL,
    `relatedTransactionId` INTEGER NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `transactions_referenceNumber_key`(`referenceNumber`),
    INDEX `transactions_accountId_idx`(`accountId`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_createdAt_idx`(`createdAt`),
    INDEX `transactions_referenceNumber_idx`(`referenceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
