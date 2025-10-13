require('dotenv').config();
const axios = require('axios');
const { pool } = require('./app/config/index.ts');

async function initMasterAccountIBAN() {
  try {
    console.log('Using database pool');

    const result = await pool.query(`
      SELECT a.id, a.account_name, a.iban, a.weavr_id, u.email
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.account_name = 'Master Account'
    `);

    if (result.rows.length === 0) {
      console.log('Master Account not found');
      return;
    }

    const masterAccount = result.rows[0];
    console.log('Found Master Account:', masterAccount);

    if (masterAccount.iban) {
      console.log('Master Account already has IBAN:', masterAccount.iban);
      return;
    }

    if (!masterAccount.weavr_id) {
      console.log('Master Account not synced with Weavr yet');
      return;
    }

    const apiKey = process.env.WEAVR_API_KEY;
    if (!apiKey) {
      throw new Error('Missing WEAVR_API_KEY in environment variables.');
    }

    console.log('Upgrading account with IBAN via local API...');
    try {
      const response = await axios.post(
        `http://localhost:3000/accounts/${masterAccount.weavr_id}/iban`,
        {},
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );
      console.log('IBAN upgrade successful for Master Account');
    } catch (error) {
      console.error('IBAN upgrade failed:', error.response?.data || error.message);
    }

  } catch (err) {
    console.error('Error initializing Master Account IBAN:', err);
  }
}

initMasterAccountIBAN();