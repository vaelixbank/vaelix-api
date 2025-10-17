import DatabaseManager from './databaseManager';
import { logger } from '../utils/logger';

interface ReplicationConfig {
  sourceDatabase: string;
  targetDatabases: string[];
  tables: string[];
  syncKey: string;
  intervalMinutes: number;
  enabled: boolean;
}

interface ReplicationJob {
  id: string;
  config: ReplicationConfig;
  lastRun?: Date;
  nextRun: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

class ReplicationService {
  private static instance: ReplicationService;
  private dbManager: DatabaseManager;
  private jobs: Map<string, ReplicationJob> = new Map();
  private intervalId?: NodeJS.Timeout;

  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.initializeDefaultJobs();
    this.startScheduler();
  }

  public static getInstance(): ReplicationService {
    if (!ReplicationService.instance) {
      ReplicationService.instance = new ReplicationService();
    }
    return ReplicationService.instance;
  }

  private initializeDefaultJobs(): void {
    // Default replication jobs - can be configured via environment or database
    const defaultJobs: ReplicationConfig[] = [
      {
        sourceDatabase: 'primary',
        targetDatabases: ['secondary'],
        tables: ['users', 'accounts', 'transactions'],
        syncKey: 'updated_at',
        intervalMinutes: 5,
        enabled: true
      },
      {
        sourceDatabase: 'primary',
        targetDatabases: ['analytics'],
        tables: ['transactions', 'audit_logs'],
        syncKey: 'created_at',
        intervalMinutes: 15,
        enabled: true
      }
    ];

    defaultJobs.forEach(config => {
      this.addReplicationJob(config);
    });
  }

  private startScheduler(): void {
    // Check every minute for jobs to run
    this.intervalId = setInterval(() => {
      this.checkAndRunJobs();
    }, 60000);

    logger.info('Replication scheduler started');
  }

  private async checkAndRunJobs(): Promise<void> {
    const now = new Date();

    for (const [jobId, job] of this.jobs) {
      if (job.status === 'running') continue;

      if (now >= job.nextRun && job.config.enabled) {
        this.runReplicationJob(jobId);
      }
    }
  }

  private async runReplicationJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.lastRun = new Date();

    try {
      logger.info(`Starting replication job ${jobId}`, {
        source: job.config.sourceDatabase,
        targets: job.config.targetDatabases,
        tables: job.config.tables
      });

      let totalSynced = 0;

      for (const table of job.config.tables) {
        const results = await this.dbManager.syncTable(
          job.config.sourceDatabase,
          job.config.targetDatabases,
          table,
          job.config.syncKey
        );

        const synced = results.reduce((sum, result) => sum + (result.recordsSynced || 0), 0);
        totalSynced += synced;

        // Log any errors
        results.filter(r => !r.success).forEach(result => {
          logger.error(`Replication failed for table ${table}`, {
            jobId,
            target: result.targetDatabaseId,
            error: result.error
          });
        });
      }

      job.status = 'completed';
      job.nextRun = new Date(Date.now() + job.config.intervalMinutes * 60000);

      logger.info(`Replication job ${jobId} completed`, {
        recordsSynced: totalSynced,
        nextRun: job.nextRun
      });

    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.nextRun = new Date(Date.now() + job.config.intervalMinutes * 60000); // Retry after interval

      logger.error(`Replication job ${jobId} failed`, { error: error.message });
    }
  }

  public addReplicationJob(config: ReplicationConfig): string {
    const jobId = `repl_${config.sourceDatabase}_${Date.now()}`;
    const job: ReplicationJob = {
      id: jobId,
      config,
      nextRun: new Date(),
      status: 'pending'
    };

    this.jobs.set(jobId, job);
    logger.info(`Added replication job ${jobId}`, { config });

    return jobId;
  }

  public removeReplicationJob(jobId: string): boolean {
    const removed = this.jobs.delete(jobId);
    if (removed) {
      logger.info(`Removed replication job ${jobId}`);
    }
    return removed;
  }

  public getReplicationJobs(): ReplicationJob[] {
    return Array.from(this.jobs.values());
  }

  public getReplicationJob(jobId: string): ReplicationJob | undefined {
    return this.jobs.get(jobId);
  }

  public enableReplicationJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      job.config.enabled = true;
      logger.info(`Enabled replication job ${jobId}`);
      return true;
    }
    return false;
  }

  public disableReplicationJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      job.config.enabled = false;
      logger.info(`Disabled replication job ${jobId}`);
      return true;
    }
    return false;
  }

  public async runReplicationJobNow(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Run immediately without waiting for scheduler
    setImmediate(() => this.runReplicationJob(jobId));
    return true;
  }

  public stopScheduler(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('Replication scheduler stopped');
    }
  }

  public async replicateTableNow(
    sourceDb: string,
    targetDbs: string[],
    table: string,
    syncKey: string
  ): Promise<any> {
    try {
      const results = await this.dbManager.syncTable(sourceDb, targetDbs, table, syncKey);

      logger.info(`Manual table replication completed`, {
        source: sourceDb,
        targets: targetDbs,
        table,
        results
      });

      return results;
    } catch (error: any) {
      logger.error(`Manual table replication failed`, {
        source: sourceDb,
        targets: targetDbs,
        table,
        error: error.message
      });
      throw error;
    }
  }
}

export default ReplicationService;
export type { ReplicationConfig, ReplicationJob };