-- Migration to add type and expires_at fields to api_keys table
-- Run this after the initial schema setup

ALTER TABLE api_keys
ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'client' CHECK (type IN ('client', 'server')),
ADD COLUMN expires_at TIMESTAMP;

-- Update existing records to have 'client' type
UPDATE api_keys SET type = 'client' WHERE type IS NULL;

-- Create index for faster lookups
CREATE INDEX idx_api_keys_key_secret ON api_keys (key, secret);
CREATE INDEX idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX idx_api_keys_type ON api_keys (type);