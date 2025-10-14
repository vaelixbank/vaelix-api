#!/usr/bin/env node

/**
 * Database Seeding Script for Vaelix Bank API
 * Seeds initial data for development and testing
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vaelix_bank',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed roles
    console.log('Creating roles...');
    await pool.query(`
      INSERT INTO roles (name, description) VALUES
      ('admin', 'System administrator with full access'),
      ('manager', 'Bank manager with elevated permissions'),
      ('user', 'Regular bank user'),
      ('api_user', 'API-only user for integrations')
      ON CONFLICT (name) DO NOTHING
    `);

    // Seed admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin123!', 12);
    const adminResult = await pool.query(`
      INSERT INTO users (email, full_name, phone, password_hash, is_verified, kyc_status, created_at, updated_at)
      VALUES ('admin@vaelixbank.com', 'System Administrator', '+33123456789', $1, true, 'approved', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [adminPassword]);

    if (adminResult.rows.length > 0) {
      const adminId = adminResult.rows[0].id;
      await pool.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        SELECT $1, id, NOW() FROM roles WHERE name = 'admin'
        ON CONFLICT DO NOTHING
      `, [adminId]);
    }

    // Seed test users
    console.log('Creating test users...');
    const testUsers = [
      { email: 'user1@example.com', name: 'John Doe', phone: '+33123456790' },
      { email: 'user2@example.com', name: 'Jane Smith', phone: '+33123456791' },
      { email: 'user3@example.com', name: 'Bob Johnson', phone: '+33123456792' },
    ];

    for (const user of testUsers) {
      const userPassword = await bcrypt.hash('Password123!', 12);
      const userResult = await pool.query(`
        INSERT INTO users (email, full_name, phone, password_hash, is_verified, kyc_status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, 'approved', NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `, [user.email, user.name, user.phone, userPassword]);

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        await pool.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_at)
          SELECT $1, id, NOW() FROM roles WHERE name = 'user'
          ON CONFLICT DO NOTHING
        `, [userId]);
      }
    }

    // Seed sample merchants
    console.log('Creating sample merchants...');
    await pool.query(`
      INSERT INTO merchants (name, merchant_id, category, country, status) VALUES
      ('Amazon', 'AMZN-EU', 'retail', 'DEU', 'active'),
      ('Netflix', 'NFLX-EU', 'entertainment', 'NLD', 'active'),
      ('Uber', 'UBER-EU', 'transport', 'FRA', 'active'),
      ('Starbucks', 'SBUX-EU', 'food', 'GBR', 'active'),
      ('Apple', 'AAPL-EU', 'technology', 'IRL', 'active')
      ON CONFLICT (merchant_id) DO NOTHING
    `);

    // Seed API keys for testing
    console.log('Creating test API keys...');
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');

    await pool.query(`
      INSERT INTO api_keys (user_id, key, secret, type, description, created_at)
      SELECT u.id, $1, $2, 'client', 'Test API Key', NOW()
      FROM users u WHERE u.email = 'admin@vaelixbank.com'
      ON CONFLICT (key) DO NOTHING
    `, [apiKey, apiSecret]);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@vaelixbank.com / Admin123!');
    console.log('Users: user1@example.com, user2@example.com, user3@example.com / Password123!');
    console.log(`API Key: ${apiKey}`);
    console.log(`API Secret: ${apiSecret}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };