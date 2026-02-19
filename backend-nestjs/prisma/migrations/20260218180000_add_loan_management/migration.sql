-- CreateEnum
-- MySQL: create loan_applications and loan_repayments with enum columns inline

-- CreateTable
CREATE TABLE `loan_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `loanType` ENUM('PERSONAL', 'HOME', 'AUTO', 'EDUCATION', 'BUSINESS') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `termMonths` INTEGER NOT NULL,
    `interestRate` DECIMAL(5, 4) NOT NULL,
    `purpose` VARCHAR(500) NULL,
    `currency` ENUM('USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'CNY', 'AUD', 'CAD') NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedAt` DATETIME(3) NULL,
    `decidedByUserId` INTEGER NULL,
    `rejectionReason` VARCHAR(500) NULL,
    `accountId` INTEGER NULL,
    `penaltyRatePercentPerMonth` DECIMAL(5, 2) NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `loan_applications_userId_idx`(`userId`),
    INDEX `loan_applications_status_idx`(`status`),
    INDEX `loan_applications_appliedAt_idx`(`appliedAt`),
    UNIQUE INDEX `loan_applications_accountId_key`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_repayments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loanApplicationId` INTEGER NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `dueDate` DATE NOT NULL,
    `principalAmount` DECIMAL(15, 2) NOT NULL,
    `interestAmount` DECIMAL(15, 2) NOT NULL,
    `penaltyAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalAmount` DECIMAL(15, 2) NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loan_repayments_loanApplicationId_installmentNumber_key`(`loanApplicationId`, `installmentNumber`),
    INDEX `loan_repayments_loanApplicationId_idx`(`loanApplicationId`),
    INDEX `loan_repayments_dueDate_idx`(`dueDate`),
    INDEX `loan_repayments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `loan_applications` ADD CONSTRAINT `loan_applications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_applications` ADD CONSTRAINT `loan_applications_decidedByUserId_fkey` FOREIGN KEY (`decidedByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_applications` ADD CONSTRAINT `loan_applications_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_repayments` ADD CONSTRAINT `loan_repayments_loanApplicationId_fkey` FOREIGN KEY (`loanApplicationId`) REFERENCES `loan_applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
