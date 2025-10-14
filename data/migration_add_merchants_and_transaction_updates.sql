-- Migration to add merchants table and update transactions table structure
-- Run this migration after the main schema and mobile_auth migration

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    merchant_id VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    country VARCHAR(3),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Update transactions table to use UUID and add new columns
-- Note: This migration assumes transactions table exists from main schema
-- If running on existing database, backup data first!

-- Add new columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36),
ADD COLUMN IF NOT EXISTS merchant_id INT REFERENCES merchants(id),
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS merchant_data JSONB,
ADD COLUMN IF NOT EXISTS reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS weavr_transaction_id VARCHAR(100);

-- Change id column to VARCHAR if it's currently SERIAL
-- WARNING: This is a destructive change that requires data migration
-- DO NOT RUN THIS ON PRODUCTION WITHOUT BACKING UP DATA FIRST

-- First, create a temporary table with new structure
CREATE TABLE transactions_new (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id INT REFERENCES accounts(id),
    customer_id VARCHAR(36),
    merchant_id INT REFERENCES merchants(id),
    amount NUMERIC(30,2) NOT NULL,
    currency CHAR(3) DEFAULT 'EUR',
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    category VARCHAR(50),
    merchant_data JSONB,
    reference VARCHAR(255),
    metadata JSONB,
    processed_at TIMESTAMP,
    weavr_transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Copy data from old table to new table
-- Generate UUIDs for existing records
INSERT INTO transactions_new (
    id, account_id, amount, currency, type, status, description,
    created_at, updated_at
)
SELECT
    gen_random_uuid()::text,
    account_id, amount, currency, type, status, description,
    created_at, updated_at
FROM transactions;

-- Update foreign key references in related tables
-- transaction_audit
UPDATE transaction_audit
SET transaction_id = transactions_new.id
FROM transactions_new
WHERE transaction_audit.transaction_id::text = transactions_new.id;

-- approvals
UPDATE approvals
SET transaction_id = transactions_new.id
FROM transactions_new
WHERE approvals.transaction_id::text = transactions_new.id;

-- fraud_detection
UPDATE fraud_detection
SET transaction_id = transactions_new.id
FROM transactions_new
WHERE fraud_detection.transaction_id::text = transactions_new.id;

-- aml_flags
UPDATE aml_flags
SET transaction_id = transactions_new.id
FROM transactions_new
WHERE aml_flags.transaction_id::text = transactions_new.id;

-- balance_history
UPDATE balance_history
SET transaction_id = transactions_new.id
FROM transactions_new
WHERE balance_history.transaction_id::text = transactions_new.id;

-- Drop old table and rename new one
DROP TABLE transactions;
ALTER TABLE transactions_new RENAME TO transactions;

-- Recreate indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_weavr_transaction_id ON transactions(weavr_transaction_id);

-- Create indexes for merchants table
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_id ON merchants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);
CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);

-- Update foreign key constraints to reference new transactions.id type
ALTER TABLE transaction_audit DROP CONSTRAINT IF EXISTS transaction_audit_transaction_id_fkey;
ALTER TABLE transaction_audit ADD CONSTRAINT transaction_audit_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES transactions(id);

ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_transaction_id_fkey;
ALTER TABLE approvals ADD CONSTRAINT approvals_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES transactions(id);

ALTER TABLE fraud_detection DROP CONSTRAINT IF EXISTS fraud_detection_transaction_id_fkey;
ALTER TABLE fraud_detection ADD CONSTRAINT fraud_detection_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES transactions(id);

ALTER TABLE aml_flags DROP CONSTRAINT IF EXISTS aml_flags_transaction_id_fkey;
ALTER TABLE aml_flags ADD CONSTRAINT aml_flags_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES transactions(id);

ALTER TABLE balance_history DROP CONSTRAINT IF EXISTS balance_history_transaction_id_fkey;
ALTER TABLE balance_history ADD CONSTRAINT balance_history_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES transactions(id);