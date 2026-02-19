-- AlterTable (MySQL: enum is inline on the column)
ALTER TABLE `users` ADD COLUMN `role` ENUM('CUSTOMER', 'EMPLOYEE', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER';
