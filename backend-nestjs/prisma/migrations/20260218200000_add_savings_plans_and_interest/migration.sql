-- Add lastInterestCreditedAt to accounts for monthly interest tracking
ALTER TABLE `accounts` ADD COLUMN `lastInterestCreditedAt` DATETIME(3) NULL;

-- Savings plans (FD and RD)
CREATE TABLE `savings_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `sourceAccountId` INTEGER NOT NULL,
    `planType` ENUM('FIXED_DEPOSIT', 'RECURRING_DEPOSIT') NOT NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'CNY', 'AUD', 'CAD') NOT NULL DEFAULT 'USD',
    `principal` DECIMAL(15, 2) NULL,
    `monthlyAmount` DECIMAL(15, 2) NULL,
    `interestRate` DECIMAL(5, 4) NOT NULL,
    `termMonths` INTEGER NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('ACTIVE', 'MATURED', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `interestCreditedTotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `lastInterestCreditedAt` DATETIME(3) NULL,
    `totalDeposited` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `nextDueDate` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `savings_plans_userId_idx`(`userId`),
    INDEX `savings_plans_status_idx`(`status`),
    INDEX `savings_plans_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `savings_plans` ADD CONSTRAINT `savings_plans_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `savings_plans` ADD CONSTRAINT `savings_plans_sourceAccountId_fkey` FOREIGN KEY (`sourceAccountId`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
