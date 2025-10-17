import { Pool, PoolConfig } from 'pg';
import config from '../config/index';
import { ApiKeyType } from '../models/ApiKey';

interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections: number;
  region?: string;
  readOnly?: boolean;
}

interface DatabaseHealth {
  id: string;
  status: 'healthy' | 'unhealthy';
  lastChecked: Date;
  connectionCount: number;
  responseTime: number;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private pools: Map<string, Pool> = new Map();
  private healthStatus: Map<string, DatabaseHealth> = new Map();

  private constructor() {
    this.initializePools();
    this.startHealthChecks();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initializePools(): void {
    config.databases.forEach(dbConfig => {
      const poolConfig: PoolConfig = {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password,
        max: dbConfig.maxConnections,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        // Force SSL/TLS encryption for all connections
        ssl: {
          rejectUnauthorized: true,
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY,
        },
        // Additional security options
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
      };

      const pool = new Pool(poolConfig);
      this.pools.set(dbConfig.id, pool);

      // Initialize health status
      this.healthStatus.set(dbConfig.id, {
        id: dbConfig.id,
        status: 'healthy',
        lastChecked: new Date(),
        connectionCount: 0,
        responseTime: 0,
      });

      console.log(`Initialized database pool for ${dbConfig.name} (${dbConfig.id})`);
    });
  }

  private startHealthChecks(): void {
    // Check health every 30 seconds
    setInterval(async () => {
      for (const [dbId, pool] of this.pools) {
        await this.checkDatabaseHealth(dbId, pool);
      }
    }, 30000);
  }

  private async checkDatabaseHealth(dbId: string, pool: Pool): Promise<void> {
    const startTime = Date.now();
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      const responseTime = Date.now() - startTime;
      const totalCount = pool.totalCount;
      const idleCount = pool.idleCount;

      this.healthStatus.set(dbId, {
        id: dbId,
        status: 'healthy',
        lastChecked: new Date(),
        connectionCount: totalCount - idleCount,
        responseTime,
      });

      console.log(`Database ${dbId} health check: OK (${responseTime}ms, ${totalCount - idleCount}/${totalCount} connections)`);
    } catch (error) {
      console.error(`Database ${dbId} health check failed:`, error);
      this.healthStatus.set(dbId, {
        id: dbId,
        status: 'unhealthy',
        lastChecked: new Date(),
        connectionCount: 0,
        responseTime: 0,
      });
    }
  }

  public getPool(databaseId: string): Pool {
    const pool = this.pools.get(databaseId);
    if (!pool) {
      throw new Error(`Database ${databaseId} not found`);
    }
    return pool;
  }

  public getPoolByApiKey(apiKeyType: ApiKeyType, userId: number): Pool {
    const databaseId = this.resolveDatabaseId(apiKeyType, userId);
    return this.getPool(databaseId);
  }

  private resolveDatabaseId(apiKeyType: ApiKeyType, userId: number): string {
    // Routing logic based on API key type and user
    switch (apiKeyType) {
      case 'database':
        // For database keys, route based on user ID (simple sharding)
        return this.routeByUserId(userId);
      case 'client':
        // Clients use primary database
        return 'primary';
      case 'server':
        // Servers can access any database based on context
        return config.defaultDatabase;
      default:
        return config.defaultDatabase;
    }
  }

  private routeByUserId(userId: number): string {
    // Simple sharding logic: even user IDs go to primary, odd to secondary
    // In production, this could be more sophisticated (geographic, load-based, etc.)
    if (userId % 2 === 0) {
      return 'primary';
    } else if (this.pools.has('secondary')) {
      return 'secondary';
    } else {
      return 'primary';
    }
  }

  public getAllDatabases(): DatabaseConfig[] {
    return config.databases;
  }

  public getDatabaseHealth(): DatabaseHealth[] {
    return Array.from(this.healthStatus.values());
  }

  public getHealthyDatabases(): string[] {
    return Array.from(this.healthStatus.values())
      .filter(health => health.status === 'healthy')
      .map(health => health.id);
  }

  public async executeQuery(databaseId: string, query: string, params: any[] = []): Promise<any> {
    const pool = this.getPool(databaseId);
    const client = await pool.connect();

    try {
      // Log sensitive operations for audit
      if (this.isSensitiveQuery(query)) {
        console.log(`Sensitive query executed on ${databaseId}: ${query.substring(0, 100)}...`);
      }

      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  }

  private isSensitiveQuery(query: string): boolean {
    const sensitivePatterns = [
      /INSERT INTO.*(?:users|accounts|transactions|api_keys)/i,
      /UPDATE.*(?:users|accounts|transactions|api_keys)/i,
      /DELETE FROM.*(?:users|accounts|transactions|api_keys)/i,
      /SELECT.*password|secret|key|token/i
    ];
    return sensitivePatterns.some(pattern => pattern.test(query));
  }

  public async executeTransaction(databaseId: string, queries: Array<{ query: string; params?: any[] }>): Promise<any[]> {
    const pool = this.getPool(databaseId);
    const client = await pool.connect();
    const results: any[] = [];

    try {
      await client.query('BEGIN');

      for (const { query, params = [] } of queries) {
        const result = await client.query(query, params);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async closeAllPools(): Promise<void> {
    for (const [dbId, pool] of this.pools) {
      console.log(`Closing pool for database ${dbId}`);
      await pool.end();
    }
    this.pools.clear();
  }

  // Federation methods for cross-database operations

  public async executeFederatedQuery(query: string, databaseIds: string[] = []): Promise<FederatedQueryResult[]> {
    const targetDatabases = databaseIds.length > 0 ? databaseIds : Array.from(this.pools.keys());
    const results: FederatedQueryResult[] = [];

    // Execute query on all target databases in parallel
    const promises = targetDatabases.map(async (dbId) => {
      try {
        const result = await this.executeQuery(dbId, query);
        return {
          databaseId: dbId,
          success: true,
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields
        };
      } catch (error: any) {
        return {
          databaseId: dbId,
          success: false,
          error: error.message
        };
      }
    });

    const queryResults = await Promise.all(promises);
    return queryResults;
  }

  public async replicateData(sourceDbId: string, targetDbIds: string[], tableName: string, data: any[]): Promise<ReplicationResult[]> {
    const results: ReplicationResult[] = [];

    for (const targetDbId of targetDbIds) {
      try {
        // Get table structure from source
        const sourcePool = this.getPool(sourceDbId);
        const structureResult = await sourcePool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);

        if (structureResult.rows.length === 0) {
          results.push({
            targetDatabaseId: targetDbId,
            success: false,
            error: `Table ${tableName} not found in source database`
          });
          continue;
        }

        // Create table in target if it doesn't exist
        const targetPool = this.getPool(targetDbId);
        const columns = structureResult.rows.map(col =>
          `"${col.column_name}" ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`
        ).join(', ');

        await targetPool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (${columns})`);

        // Insert data
        if (data.length > 0) {
          const columnsList = structureResult.rows.map(col => `"${col.column_name}"`).join(', ');
          const values = data.map(row =>
            '(' + structureResult.rows.map(col => {
              const value = row[col.column_name];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              return value;
            }).join(', ') + ')'
          ).join(', ');

          await targetPool.query(`INSERT INTO "${tableName}" (${columnsList}) VALUES ${values}`);
        }

        results.push({
          targetDatabaseId: targetDbId,
          success: true,
          recordsInserted: data.length
        });
      } catch (error: any) {
        results.push({
          targetDatabaseId: targetDbId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  public async syncTable(sourceDbId: string, targetDbIds: string[], tableName: string, syncKey: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      // Get latest data from source
      const sourcePool = this.getPool(sourceDbId);
      const sourceData = await sourcePool.query(`SELECT * FROM "${tableName}" ORDER BY "${syncKey}" DESC`);

      for (const targetDbId of targetDbIds) {
        try {
          const targetPool = this.getPool(targetDbId);

          // Get max sync key from target
          const targetMaxResult = await targetPool.query(`SELECT MAX("${syncKey}") as max_key FROM "${tableName}"`);
          const targetMaxKey = targetMaxResult.rows[0]?.max_key;

          // Get records newer than target's max key
          let newRecords;
          if (targetMaxKey) {
            newRecords = sourceData.rows.filter(row => row[syncKey] > targetMaxKey);
          } else {
            newRecords = sourceData.rows;
          }

          if (newRecords.length > 0) {
            // Insert new records
            const columns = Object.keys(newRecords[0]).map(col => `"${col}"`).join(', ');
            const values = newRecords.map(row =>
              '(' + Object.values(row).map(val => {
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                return val;
              }).join(', ') + ')'
            ).join(', ');

            await targetPool.query(`INSERT INTO "${tableName}" (${columns}) VALUES ${values}`);
          }

          results.push({
            targetDatabaseId: targetDbId,
            success: true,
            recordsSynced: newRecords.length
          });
        } catch (error: any) {
          results.push({
            targetDatabaseId: targetDbId,
            success: false,
            error: error.message
          });
        }
      }
    } catch (error: any) {
      // If source query fails, mark all targets as failed
      for (const targetDbId of targetDbIds) {
        results.push({
          targetDatabaseId: targetDbId,
          success: false,
          error: `Source query failed: ${error.message}`
        });
      }
    }

    return results;
  }

  public async getFederatedHealthStatus(): Promise<FederatedHealthStatus> {
    const healthStatus = this.getDatabaseHealth();
    const healthyCount = healthStatus.filter(h => h.status === 'healthy').length;
    const totalCount = healthStatus.length;

    return {
      overallStatus: healthyCount === totalCount ? 'healthy' : healthyCount > 0 ? 'degraded' : 'unhealthy',
      healthyCount,
      totalCount,
      databases: healthStatus
    };
  }
}

// Type definitions for federation results
export interface FederatedQueryResult {
  databaseId: string;
  success: boolean;
  rows?: any[];
  rowCount?: number;
  fields?: any[];
  error?: string;
}

export interface ReplicationResult {
  targetDatabaseId: string;
  success: boolean;
  recordsInserted?: number;
  error?: string;
}

export interface SyncResult {
  targetDatabaseId: string;
  success: boolean;
  recordsSynced?: number;
  error?: string;
}

export interface FederatedHealthStatus {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  healthyCount: number;
  totalCount: number;
  databases: DatabaseHealth[];
}

export default DatabaseManager;