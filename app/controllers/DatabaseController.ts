import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/apiKeyAuth';
import DatabaseManager from '../services/databaseManager';
import ReplicationService from '../services/replicationService';

export class DatabaseController {
  // Execute a query on the routed database
  static async executeQuery(req: AuthenticatedRequest, res: Response) {
    try {
      const { query, params = [] } = req.body;

      if (!query) {
        return res.status(400).json({
          error: 'Query parameter is required',
          code: 'MISSING_QUERY'
        });
      }

      if (!req.databasePool) {
        return res.status(500).json({
          error: 'Database not routed',
          code: 'DATABASE_NOT_ROUTED'
        });
      }

      const result = await req.databasePool.query(query, params);

      res.json({
        success: true,
        database: req.databaseId,
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(field => ({
          name: field.name,
          type: field.dataTypeID
        }))
      });
    } catch (error: any) {
      console.error('Query execution error:', error);
      res.status(500).json({
        error: 'Query execution failed',
        code: 'QUERY_EXECUTION_ERROR',
        details: error.message
      });
    }
  }

  // Execute multiple queries in a transaction
  static async executeTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { queries } = req.body;

      if (!Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({
          error: 'Queries array is required',
          code: 'INVALID_QUERIES'
        });
      }

      if (!req.databasePool) {
        return res.status(500).json({
          error: 'Database not routed',
          code: 'DATABASE_NOT_ROUTED'
        });
      }

      const dbManager = DatabaseManager.getInstance();
      const results = await dbManager.executeTransaction(req.databaseId!, queries);

      res.json({
        success: true,
        database: req.databaseId,
        results: results.map(result => ({
          rows: result.rows,
          rowCount: result.rowCount
        }))
      });
    } catch (error: any) {
      console.error('Transaction execution error:', error);
      res.status(500).json({
        error: 'Transaction execution failed',
        code: 'TRANSACTION_EXECUTION_ERROR',
        details: error.message
      });
    }
  }

  // Get database information and health status
  static async getDatabaseInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const dbManager = DatabaseManager.getInstance();
      const databases = dbManager.getAllDatabases();
      const healthStatus = dbManager.getDatabaseHealth();

      const currentDb = databases.find(db => db.id === req.databaseId);
      const currentHealth = healthStatus.find(h => h.id === req.databaseId);

      res.json({
        currentDatabase: {
          ...currentDb,
          health: currentHealth
        },
        allDatabases: databases.map(db => ({
          ...db,
          health: healthStatus.find(h => h.id === db.id)
        })),
        healthyDatabases: dbManager.getHealthyDatabases()
      });
    } catch (error: any) {
      console.error('Error getting database info:', error);
      res.status(500).json({
        error: 'Failed to get database information',
        code: 'DATABASE_INFO_ERROR'
      });
    }
  }

  // Cross-database query (federation)
  static async executeFederatedQuery(req: AuthenticatedRequest, res: Response) {
    try {
      const { query, databases: targetDatabases } = req.body;

      if (!query) {
        return res.status(400).json({
          error: 'Query parameter is required',
          code: 'MISSING_QUERY'
        });
      }

      const dbManager = DatabaseManager.getInstance();
      const healthyDbs = dbManager.getHealthyDatabases();

      // If no specific databases requested, use all healthy ones
      const databasesToQuery = targetDatabases || healthyDbs;

      const results: any[] = [];

      for (const dbId of databasesToQuery) {
        if (!healthyDbs.includes(dbId)) {
          results.push({
            database: dbId,
            error: 'Database unhealthy',
            status: 'skipped'
          });
          continue;
        }

        try {
          const result = await dbManager.executeQuery(dbId, query);
          results.push({
            database: dbId,
            rows: result.rows,
            rowCount: result.rowCount,
            status: 'success'
          });
        } catch (error: any) {
          results.push({
            database: dbId,
            error: error.message,
            status: 'error'
          });
        }
      }

      res.json({
        success: true,
        federated: true,
        results
      });
    } catch (error: any) {
      console.error('Federated query error:', error);
      res.status(500).json({
        error: 'Federated query execution failed',
        code: 'FEDERATED_QUERY_ERROR',
        details: error.message
      });
    }
  }

  // Get database schema information
  static async getSchemaInfo(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.databasePool) {
        return res.status(500).json({
          error: 'Database not routed',
          code: 'DATABASE_NOT_ROUTED'
        });
      }

      // Get tables
      const tablesResult = await req.databasePool.query(`
        SELECT schemaname, tablename, tableowner
        FROM pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schemaname, tablename
      `);

      // Get table columns for each table
      const schemaInfo: any[] = [];

      for (const table of tablesResult.rows) {
        const columnsResult = await req.databasePool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [table.schemaname, table.tablename]);

        schemaInfo.push({
          schema: table.schemaname,
          table: table.tablename,
          owner: table.tableowner,
          columns: columnsResult.rows
        });
      }

      res.json({
        database: req.databaseId,
        schema: schemaInfo
      });
    } catch (error: any) {
      console.error('Schema info error:', error);
      res.status(500).json({
        error: 'Failed to get schema information',
        code: 'SCHEMA_INFO_ERROR',
        details: error.message
      });
    }
  }

  // Health check endpoint
  static async healthCheck(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.databasePool) {
        return res.status(500).json({
          error: 'Database not routed',
          code: 'DATABASE_NOT_ROUTED'
        });
      }

      const startTime = Date.now();
      await req.databasePool.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      res.json({
        database: req.databaseId,
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(503).json({
        database: req.databaseId,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Replication management endpoints
  static async getReplicationJobs(req: AuthenticatedRequest, res: Response) {
    try {
      const replicationService = ReplicationService.getInstance();
      const jobs = replicationService.getReplicationJobs();

      res.json({
        jobs: jobs.map(job => ({
          id: job.id,
          config: job.config,
          status: job.status,
          lastRun: job.lastRun,
          nextRun: job.nextRun,
          error: job.error
        }))
      });
    } catch (error: any) {
      console.error('Error getting replication jobs:', error);
      res.status(500).json({
        error: 'Failed to get replication jobs',
        code: 'REPLICATION_JOBS_ERROR'
      });
    }
  }

  static async createReplicationJob(req: AuthenticatedRequest, res: Response) {
    try {
      const { sourceDatabase, targetDatabases, tables, syncKey, intervalMinutes, enabled = true } = req.body;

      if (!sourceDatabase || !targetDatabases || !tables || !syncKey || !intervalMinutes) {
        return res.status(400).json({
          error: 'Missing required fields: sourceDatabase, targetDatabases, tables, syncKey, intervalMinutes',
          code: 'MISSING_REPLICATION_FIELDS'
        });
      }

      const replicationService = ReplicationService.getInstance();
      const jobId = replicationService.addReplicationJob({
        sourceDatabase,
        targetDatabases,
        tables,
        syncKey,
        intervalMinutes,
        enabled
      });

      res.status(201).json({
        success: true,
        jobId,
        message: 'Replication job created successfully'
      });
    } catch (error: any) {
      console.error('Error creating replication job:', error);
      res.status(500).json({
        error: 'Failed to create replication job',
        code: 'CREATE_REPLICATION_JOB_ERROR'
      });
    }
  }

  static async runReplicationNow(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          error: 'Job ID is required',
          code: 'MISSING_JOB_ID'
        });
      }

      const replicationService = ReplicationService.getInstance();
      const success = await replicationService.runReplicationJobNow(jobId);

      if (!success) {
        return res.status(404).json({
          error: 'Replication job not found',
          code: 'JOB_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Replication job started'
      });
    } catch (error: any) {
      console.error('Error running replication job:', error);
      res.status(500).json({
        error: 'Failed to run replication job',
        code: 'RUN_REPLICATION_ERROR'
      });
    }
  }

  static async replicateTableNow(req: AuthenticatedRequest, res: Response) {
    try {
      const { sourceDatabase, targetDatabases, table, syncKey } = req.body;

      if (!sourceDatabase || !targetDatabases || !table || !syncKey) {
        return res.status(400).json({
          error: 'Missing required fields: sourceDatabase, targetDatabases, table, syncKey',
          code: 'MISSING_TABLE_REPLICATION_FIELDS'
        });
      }

      const replicationService = ReplicationService.getInstance();
      const results = await replicationService.replicateTableNow(sourceDatabase, targetDatabases, table, syncKey);

      res.json({
        success: true,
        results
      });
    } catch (error: any) {
      console.error('Error replicating table:', error);
      res.status(500).json({
        error: 'Failed to replicate table',
        code: 'TABLE_REPLICATION_ERROR',
        details: error.message
      });
    }
  }
}