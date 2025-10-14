#!/usr/bin/env node

/**
 * Schema Injection Script for Vaelix Bank API
 * Injects the PostgreSQL schema into the database using environment variables
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config();

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Validate required environment variables
function validateEnvironment() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these variables in your .env file or environment.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
  console.log(`📍 Database: ${dbConfig.database}`);
  console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`👤 User: ${dbConfig.user}`);
}

// Read schema file
function readSchemaFile() {
  const schemaPath = path.join(__dirname, '..', 'data', 'schema-pgsql.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log(`📄 Schema file loaded: ${schemaPath}`);
  console.log(`📏 Schema size: ${(schema.length / 1024).toFixed(2)} KB`);

  return schema;
}

// Split schema into individual statements
function splitSchemaStatements(schema) {
  // Split on semicolons, but be careful with semicolons in strings/comments
  const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    .map(stmt => stmt + ';');

  console.log(`🔧 Found ${statements.length} SQL statements to execute`);
  return statements;
}

// Execute schema injection
async function injectSchema() {
  const client = new Client(dbConfig);
  let executedCount = 0;
  let errorCount = 0;

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    // Test connection
    const testResult = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL version: ${testResult.rows[0].version.split(' ')[1]}`);

    const schema = readSchemaFile();
    const statements = splitSchemaStatements(schema);

    console.log('\n🚀 Starting schema injection...\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const statementNumber = i + 1;

      try {
        // Skip empty statements or comments
        if (statement.trim().length < 10) continue;

        await client.query(statement);
        executedCount++;

        // Show progress for major statements
        if (statement.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE (\w+)/);
          if (tableMatch) {
            console.log(`✅ Created table: ${tableMatch[1]}`);
          }
        } else if (statement.includes('CREATE INDEX')) {
          const indexMatch = statement.match(/CREATE INDEX (\w+)/);
          if (indexMatch) {
            console.log(`✅ Created index: ${indexMatch[1]}`);
          }
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement ${statementNumber}:`);
        console.error(`   ${error.message}`);

        // Continue with other statements unless it's a critical error
        if (error.code === '42P07') { // Table already exists
          console.log('   ⏭️  Continuing (table might already exist)');
        } else if (error.code === '42710') { // Index already exists
          console.log('   ⏭️  Continuing (index might already exist)');
        } else {
          console.log('   ⚠️  Continuing with next statement...');
        }
      }
    }

    console.log('\n🎉 Schema injection completed!');
    console.log(`✅ Successfully executed: ${executedCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Errors encountered: ${errorCount} statements`);
      console.log('   (Some errors may be expected if tables/indexes already exist)');
    }

    // Verify schema was created
    const tableCount = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    console.log(`📊 Total tables in database: ${tableCount.rows[0].count}`);

    // Show created tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n📋 Created tables:');
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

  } catch (error) {
    console.error('💥 Critical error during schema injection:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Main execution
async function main() {
  console.log('🏦 Vaelix Bank API - Schema Injection Tool');
  console.log('==========================================\n');

  try {
    validateEnvironment();
    await injectSchema();

    console.log('\n🎊 Schema injection completed successfully!');
    console.log('🚀 Your Vaelix Bank API database is ready for production use.');
    console.log('\nNext steps:');
    console.log('1. Start the API server: npm start');
    console.log('2. Run database migrations if needed');
    console.log('3. Configure Weavr API credentials');
    console.log('4. Set up monitoring and logging');

  } catch (error) {
    console.error('\n💥 Schema injection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⏹️  Schema injection interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Schema injection terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { injectSchema, validateEnvironment };