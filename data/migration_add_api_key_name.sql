-- Migration to add name field to api_keys table
-- Run this after the initial schema setup

ALTER TABLE api_keys
ADD COLUMN name VARCHAR(50);

-- Create index for faster lookups by name
CREATE INDEX idx_api_keys_name ON api_keys (name);

-- Update existing records to have a default name if needed
-- UPDATE api_keys SET name = 'default-key' WHERE name IS NULL;