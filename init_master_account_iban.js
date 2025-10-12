require('dotenv').config();
const { Client } = require('pg');
const { WeavrService } = require('./app/services/weavrService');
const { WeavrSyncService } = require('./app/services/weavrSyncService');
const { AccountQueries } = require('./app/queries/accountQueries');

const dbClient = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function loginToWeavr(identifier, password, apiKey) {
  const weavrService = new WeavrService();
  const result = await weavrService.makeRequest(
    'POST',
    '/multi/access/login',
    { identifier, password },
    apiKey
  );
  return result.access_token;
}

async function initMasterAccountIBAN() {
  try {
    await dbClient.connect();
    console.log('Connected to database');

    // Find Master Account
    const accounts = await dbClient.query(`
      SELECT a.id, a.account_name, a.iban, a.weavr_id, u.email FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.account_name = 'Master Account'
    `);

    if (accounts.rows.length === 0) {
      console.log('Master Account not found');
      return;
    }

    const masterAccount = accounts.rows[0];
    console.log('Found Master Account:', masterAccount);

    if (masterAccount.iban) {
      console.log('Master Account already has IBAN:', masterAccount.iban);
      return;
    }

    if (!masterAccount.weavr_id) {
      console.log('Master Account not synced with Weavr yet');
      return;
    }

    // Initialize services
    const weavrService = new WeavrService();
    const syncService = new WeavrSyncService(weavrService);

    const apiKey = process.env.WEAVR_API_KEY;
    const userEmail = masterAccount.email;
    const userPassword = process.env.MASTER_USER_PASSWORD; // Add this to .env

    if (!userPassword) {
      console.log('MASTER_USER_PASSWORD not set. Please set it in .env');
      return;
    }

    console.log('Logging in to Weavr...');
    const authToken = await loginToWeavr(userEmail, userPassword, apiKey);
    console.log('Auth token obtained');

    console.log('Upgrading account with IBAN...');
    const result = await syncService.upgradeAccountToIBAN(masterAccount.id, apiKey, authToken);

    if (result.success) {
      console.log('IBAN upgrade successful for Master Account');
    } else {
      console.log('IBAN upgrade failed:', result.error);
    }

  } catch (err) {
    console.error('Error initializing Master Account IBAN:', err);
  } finally {
    await dbClient.end();
  }
}

initMasterAccountIBAN();