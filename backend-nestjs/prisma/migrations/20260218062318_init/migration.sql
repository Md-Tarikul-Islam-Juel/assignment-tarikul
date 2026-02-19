-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `loginSource` VARCHAR(191) NOT NULL DEFAULT 'default',
    `authorizerId` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL,
    `isForgetPassword` BOOLEAN NOT NULL,
    `mfaEnabled` BOOLEAN NOT NULL DEFAULT false,
    `failedOtpAttempts` INTEGER NOT NULL DEFAULT 0,
    `accountLockedUntil` DATETIME(3) NULL,
    `lastActivityAt` DATETIME(3) NULL,
    `logoutPin` VARCHAR(191) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
