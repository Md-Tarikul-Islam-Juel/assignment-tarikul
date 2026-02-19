-- Add column for lookup hash (HMAC-SHA256 of account number). New/backfilled rows will have this set.
ALTER TABLE `accounts` ADD COLUMN `accountNumberHash` VARCHAR(64) NULL;

-- Drop indexes on accountNumber first (MySQL cannot index TEXT without key length; we will change column to TEXT next)
DROP INDEX `accounts_accountNumber_key` ON `accounts`;
DROP INDEX `accounts_accountNumber_idx` ON `accounts`;

-- Store encrypted payload in accountNumber (AES-256-GCM base64); allow longer content
ALTER TABLE `accounts` MODIFY COLUMN `accountNumber` TEXT NOT NULL;

-- Unique index for lookup by plaintext account number (via hash)
CREATE UNIQUE INDEX `accounts_accountNumberHash_key` ON `accounts`(`accountNumberHash`);
CREATE INDEX `accounts_accountNumberHash_idx` ON `accounts`(`accountNumberHash`);
