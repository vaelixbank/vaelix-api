#!/usr/bin/env node

/**
 * Database Backup and Restore Scripts for Vaelix Bank API
 * Provides utilities for database maintenance and disaster recovery
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'vaelix_bank',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// Backup directory
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Generate timestamped backup filename
 */
function generateBackupFilename(prefix = 'backup') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.sql`;
}

/**
 * Execute shell command with promise
 */
function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Create database backup
 */
async function createBackup(filename) {
  try {
    ensureBackupDir();

    const backupPath = path.join(BACKUP_DIR, filename || generateBackupFilename());
    const pgDumpCommand = `pg_dump "postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}" > "${backupPath}"`;

    console.log('💾 Creating database backup...');
    console.log(`Target: ${backupPath}`);

    await execPromise(pgDumpCommand);

    // Get file size
    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully: ${backupPath} (${sizeMB} MB)`);
    return backupPath;

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Restore database from backup
 */
async function restoreBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    console.log('🔄 Restoring database from backup...');
    console.log(`Source: ${backupPath}`);

    // Drop and recreate database
    const dropCommand = `psql "postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/postgres" -c "DROP DATABASE IF EXISTS ${dbConfig.database};"`;
    const createCommand = `psql "postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/postgres" -c "CREATE DATABASE ${dbConfig.database};"`;
    const restoreCommand = `psql "postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}" < "${backupPath}"`;

    console.log('Dropping existing database...');
    await execPromise(dropCommand);

    console.log('Creating new database...');
    await execPromise(createCommand);

    console.log('Restoring from backup...');
    await execPromise(restoreCommand);

    console.log('✅ Database restored successfully!');

  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

/**
 * List available backups
 */
function listBackups() {
  try {
    ensureBackupDir();

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          created: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    if (files.length === 0) {
      console.log('📂 No backup files found');
      return [];
    }

    console.log('📂 Available backups:');
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.size}) - ${file.created}`);
    });

    return files;

  } catch (error) {
    console.error('❌ Error listing backups:', error.message);
    return [];
  }
}

/**
 * Clean old backups (keep only N most recent)
 */
function cleanOldBackups(keepCount = 10) {
  try {
    const files = listBackups();

    if (files.length <= keepCount) {
      console.log(`🧹 No old backups to clean (keeping ${keepCount})`);
      return;
    }

    const toDelete = files.slice(keepCount);
    console.log(`🧹 Cleaning ${toDelete.length} old backup(s)...`);

    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Deleted: ${file.name}`);
    });

    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Error cleaning backups:', error.message);
  }
}

/**
 * Main CLI interface
 */
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'backup':
      await createBackup(arg);
      break;

    case 'restore':
      if (!arg) {
        console.error('❌ Please specify backup file path');
        console.log('Usage: node db-backup-restore.js restore <backup-file>');
        process.exit(1);
      }
      await restoreBackup(arg);
      break;

    case 'list':
      listBackups();
      break;

    case 'clean':
      const keepCount = arg ? parseInt(arg) : 10;
      cleanOldBackups(keepCount);
      break;

    default:
      console.log('🛠️  Database Backup/Restore Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node db-backup-restore.js backup [filename]    - Create database backup');
      console.log('  node db-backup-restore.js restore <file>        - Restore from backup file');
      console.log('  node db-backup-restore.js list                  - List available backups');
      console.log('  node db-backup-restore.js clean [count]         - Clean old backups (default: keep 10)');
      console.log('');
      console.log('Environment variables:');
      console.log('  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      console.log('  BACKUP_DIR (default: ../backups)');
      break;
  }
}

// Export functions for programmatic use
module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  cleanOldBackups,
};

// Run CLI if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}