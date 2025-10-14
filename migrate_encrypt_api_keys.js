#!/usr/bin/env node

/**
 * Migration script to encrypt existing API key secrets with AES256
 *
 * This script:
 * 1. Reads all existing API keys from the database
 * 2. Generates new secrets for each key (since bcrypt is one-way)
 * 3. Encrypts the new secrets with AES256
 * 4. Updates the database with encrypted secrets
 *
 * WARNING: This will invalidate all existing API key secrets!
 * Users will need to retrieve new secrets after this migration.
 */

require('dotenv').config();
const pool = require('./app/utils/database');
const crypto = require('crypto');
const { encrypt } = require('./app/utils/crypto');

async function migrateApiKeys() {
  console.log('Starting API key encryption migration...');

  try {
    // Get all existing API keys
    const result = await pool.query('SELECT id, key, user_id, type FROM api_keys');
    const apiKeys = result.rows;

    console.log(`Found ${apiKeys.length} API keys to migrate`);

    for (const apiKey of apiKeys) {
      // Generate a new secret
      const newSecret = crypto.randomBytes(64).toString('hex');

      // Encrypt the new secret
      const encryptedSecret = encrypt(newSecret);

      // Update the database
      await pool.query(
        'UPDATE api_keys SET secret = $1 WHERE id = $2',
        [encryptedSecret, apiKey.id]
      );

      console.log(`Migrated API key ${apiKey.key} (ID: ${apiKey.id})`);
    }

    console.log('Migration completed successfully!');
    console.log('WARNING: All existing API key secrets have been invalidated.');
    console.log('Users must generate new API keys to continue using the API.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateApiKeys();