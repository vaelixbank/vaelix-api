-- Migration to encrypt existing API key secrets with AES256
-- This script should be run after setting up the ENCRYPTION_KEY environment variable
-- WARNING: This migration is one-way. Make sure to backup your database before running!

-- Note: This migration needs to be executed via a Node.js script since it requires
-- cryptographic operations that cannot be done in pure SQL.
-- Use the migration script: migrate_encrypt_api_keys.js

-- The actual migration logic is in migrate_encrypt_api_keys.js
-- This file serves as documentation for the migration process