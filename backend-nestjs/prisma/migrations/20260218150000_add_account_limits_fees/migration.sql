-- AlterTable
ALTER TABLE `accounts` ADD COLUMN `dailyWithdrawalLimit` DECIMAL(15, 2) NULL,
    ADD COLUMN `transferFeePercent` DECIMAL(5, 4) NULL,
    ADD COLUMN `transferFeeFixed` DECIMAL(15, 2) NULL;
