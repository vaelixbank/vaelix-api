#!/usr/bin/env node

/**
 * Database Health Check Script for Vaelix Bank API
 * Performs comprehensive health checks on the database
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vaelix_bank',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 5000, // 5 second timeout
});

/**
 * Health check result
 */
class HealthCheckResult {
  constructor(name) {
    this.name = name;
    this.status = 'unknown';
    this.message = '';
    this.details = {};
    this.duration = 0;
  }

  success(message = 'OK', details = {}) {
    this.status = 'pass';
    this.message = message;
    this.details = details;
    return this;
  }

  failure(message, details = {}) {
    this.status = 'fail';
    this.message = message;
    this.details = details;
    return this;
  }

  warning(message, details = {}) {
    this.status = 'warn';
    this.message = message;
    this.details = details;
    return this;
  }
}

/**
 * Run a health check with timing
 */
async function runCheck(name, checkFunction) {
  const result = new HealthCheckResult(name);
  const startTime = Date.now();

  try {
    const checkResult = await checkFunction();
    result.duration = Date.now() - startTime;

    if (checkResult.status) {
      result.status = checkResult.status;
    } else {
      result.status = 'pass';
    }

    result.message = checkResult.message || 'OK';
    result.details = checkResult.details || {};

  } catch (error) {
    result.duration = Date.now() - startTime;
    result.status = 'fail';
    result.message = error.message;
    result.details = { error: error.stack };
  }

  return result;
}

/**
 * Check database connectivity
 */
async function checkConnectivity() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return { message: 'Database connection successful' };
  } finally {
    client.release();
  }
}

/**
 * Check if all required tables exist
 */
async function checkTablesExist() {
  const requiredTables = [
    'users', 'roles', 'user_roles', 'accounts', 'account_mirrors', 'wallets',
    'vibans_cards', 'card_provisioning', 'transactions', 'transaction_audit',
    'transaction_limits', 'fx_rates', 'notifications', 'api_keys', 'approvals',
    'audit_logs', 'audit_policies', 'board_members', 'card_transactions',
    'fraud_detection', 'insurance_contracts', 'interbank_transfers', 'investments',
    'kyc_documents', 'ledger_snapshots', 'loans', 'login_attempts', 'merchant_profiles',
    'openpayd_mappings', 'partner_banks', 'partner_integrations', 'payment_requests',
    'protocol_versions', 'regulatory_reports', 'savings', 'security_incidents',
    'sessions', 'support_tickets', 'vbg_nodes', 'wealth_portfolios', 'aml_flags',
    'beneficiaries', 'beneficiary_batches', 'bulk_processes', 'bulk_operations',
    'linked_accounts', 'account_identifiers', 'auth_factors', 'sca_challenges',
    'consumers', 'corporates', 'balance_history', 'weavr_sync', 'webhook_events',
    'open_banking_consents', 'payment_initiations', 'webhook_subscriptions',
    'webhook_events_open_banking', 'webhook_deliveries', 'baas_customers',
    'baas_accounts', 'baas_cards', 'baas_transactions', 'kyc_profiles',
    'aml_screening_results', 'regulatory_reports', 'compliance_incidents',
    'data_retention_policies', 'data_retention_records', 'consent_records',
    'risk_assessments', 'audit_trail', 'security_events', 'merchants',
    'verification_codes', 'password_reset_tokens'
  ];

  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const existingTables = result.rows.map(row => row.table_name);
  const missingTables = requiredTables.filter(table => !existingTables.includes(table));

  if (missingTables.length === 0) {
    return {
      message: `All ${requiredTables.length} tables exist`,
      details: { totalTables: existingTables.length, requiredTables: requiredTables.length }
    };
  } else {
    return {
      status: 'fail',
      message: `Missing ${missingTables.length} table(s)`,
      details: { missingTables, existingTables: existingTables.length, requiredTables: requiredTables.length }
    };
  }
}

/**
 * Check table record counts
 */
async function checkTableCounts() {
  const tables = [
    'users', 'accounts', 'transactions', 'api_keys', 'sessions'
  ];

  const counts = {};

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
    } catch (error) {
      counts[table] = `Error: ${error.message}`;
    }
  }

  return {
    message: 'Table record counts retrieved',
    details: counts
  };
}

/**
 * Check database performance metrics
 */
async function checkPerformance() {
  const metrics = {};

  // Connection count
  try {
    const connResult = await pool.query(`
      SELECT count(*) as connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    metrics.connections = parseInt(connResult.rows[0].connections);
  } catch (error) {
    metrics.connections = `Error: ${error.message}`;
  }

  // Database size
  try {
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    metrics.databaseSize = sizeResult.rows[0].size;
  } catch (error) {
    metrics.databaseSize = `Error: ${error.message}`;
  }

  // Cache hit ratio
  try {
    const cacheResult = await pool.query(`
      SELECT
        round(100 * sum(blks_hit)::numeric / (sum(blks_hit) + sum(blks_read)), 2) as cache_hit_ratio
      FROM pg_stat_database
      WHERE datname = current_database()
    `);
    metrics.cacheHitRatio = cacheResult.rows[0].cache_hit_ratio + '%';
  } catch (error) {
    metrics.cacheHitRatio = `Error: ${error.message}`;
  }

  return {
    message: 'Performance metrics retrieved',
    details: metrics
  };
}

/**
 * Check foreign key constraints
 */
async function checkConstraints() {
  const result = await pool.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);

  const constraints = result.rows.length;
  const tablesWithConstraints = new Set(result.rows.map(row => row.table_name)).size;

  return {
    message: `${constraints} foreign key constraints found across ${tablesWithConstraints} tables`,
    details: {
      totalConstraints: constraints,
      tablesWithConstraints
    }
  };
}

/**
 * Check for orphaned records
 */
async function checkDataIntegrity() {
  const issues = [];

  // Check for users without roles
  try {
    const rolelessUsers = await pool.query(`
      SELECT COUNT(*) as count FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.user_id IS NULL
    `);
    if (parseInt(rolelessUsers.rows[0].count) > 0) {
      issues.push(`Found ${rolelessUsers.rows[0].count} users without roles`);
    }
  } catch (error) {
    issues.push(`Error checking user roles: ${error.message}`);
  }

  // Check for accounts without users
  try {
    const orphanedAccounts = await pool.query(`
      SELECT COUNT(*) as count FROM accounts a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE u.id IS NULL
    `);
    if (parseInt(orphanedAccounts.rows[0].count) > 0) {
      issues.push(`Found ${orphanedAccounts.rows[0].count} accounts without users`);
    }
  } catch (error) {
    issues.push(`Error checking account ownership: ${error.message}`);
  }

  // Check for transactions without accounts
  try {
    const orphanedTransactions = await pool.query(`
      SELECT COUNT(*) as count FROM transactions t
      LEFT JOIN accounts a ON t.account_id::text = a.id::text
      WHERE a.id IS NULL
    `);
    if (parseInt(orphanedTransactions.rows[0].count) > 0) {
      issues.push(`Found ${orphanedTransactions.rows[0].count} transactions without accounts`);
    }
  } catch (error) {
    issues.push(`Error checking transaction accounts: ${error.message}`);
  }

  if (issues.length === 0) {
    return { message: 'No data integrity issues found' };
  } else {
    return {
      status: 'warn',
      message: `Found ${issues.length} data integrity issue(s)`,
      details: { issues }
    };
  }
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  console.log('🏥 Running database health checks...\n');

  const checks = [
    runCheck('Database Connectivity', checkConnectivity),
    runCheck('Table Existence', checkTablesExist),
    runCheck('Table Record Counts', checkTableCounts),
    runCheck('Performance Metrics', checkPerformance),
    runCheck('Foreign Key Constraints', checkConstraints),
    runCheck('Data Integrity', checkDataIntegrity),
  ];

  const results = await Promise.all(checks);

  // Display results
  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.name}: ${result.message} (${result.duration}ms)`);

    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }

    console.log('');

    switch (result.status) {
      case 'pass': passCount++; break;
      case 'fail': failCount++; break;
      case 'warn': warnCount++; break;
    }
  });

  // Summary
  console.log('📊 Health Check Summary:');
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ⚠️  Warnings: ${warnCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  const overallStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';
  const statusIcon = overallStatus === 'pass' ? '✅' : overallStatus === 'fail' ? '❌' : '⚠️';

  console.log(`\n${statusIcon} Overall Status: ${overallStatus.toUpperCase()}`);

  return {
    overallStatus,
    results: results.map(r => ({
      name: r.name,
      status: r.status,
      message: r.message,
      duration: r.duration,
      details: r.details
    }))
  };
}

/**
 * Main CLI interface
 */
async function main() {
  try {
    const result = await runHealthChecks();

    // Exit with appropriate code
    if (result.overallStatus === 'fail') {
      process.exit(1);
    } else if (result.overallStatus === 'warn') {
      process.exit(2); // Warning exit code
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('💥 Fatal error during health check:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Export for programmatic use
module.exports = {
  runHealthChecks,
  HealthCheckResult
};

// Run CLI if called directly
if (require.main === module) {
  main();
}