-- Migration to add 'database' type to api_keys table check constraint
-- This allows creating API keys with type 'database' for database access

-- Drop the existing check constraint
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_type_check;

-- Add the new check constraint that includes 'database' type
ALTER TABLE api_keys ADD CONSTRAINT api_keys_type_check
CHECK (type IN ('client', 'server', 'database'));

-- Update the index to include the new type
DROP INDEX IF EXISTS idx_api_keys_type;
CREATE INDEX idx_api_keys_type ON api_keys (type);