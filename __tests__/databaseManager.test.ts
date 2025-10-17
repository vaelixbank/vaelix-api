import DatabaseManager from '../app/services/databaseManager';
import ReplicationService from '../app/services/replicationService';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeAll(() => {
    dbManager = DatabaseManager.getInstance();
  });

  describe('Basic functionality', () => {
    test('should get all databases', () => {
      const databases = dbManager.getAllDatabases();
      expect(databases).toBeDefined();
      expect(Array.isArray(databases)).toBe(true);
      expect(databases.length).toBeGreaterThan(0);
    });

    test('should get database health', () => {
      const health = dbManager.getDatabaseHealth();
      expect(health).toBeDefined();
      expect(Array.isArray(health)).toBe(true);
    });

    test('should get healthy databases', () => {
      const healthy = dbManager.getHealthyDatabases();
      expect(healthy).toBeDefined();
      expect(Array.isArray(healthy)).toBe(true);
    });
  });

  describe('Federated queries', () => {
    test('should execute federated query', async () => {
      const query = 'SELECT 1 as test_column';
      const results = await dbManager.executeFederatedQuery(query);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      results.forEach(result => {
        expect(result).toHaveProperty('databaseId');
        expect(result).toHaveProperty('success');
        if (result.success) {
          expect(result).toHaveProperty('rows');
          expect(result).toHaveProperty('rowCount');
        }
      });
    });
  });
});

describe('ReplicationService', () => {
  let replicationService: ReplicationService;

  beforeAll(() => {
    replicationService = ReplicationService.getInstance();
  });

  describe('Job management', () => {
    test('should get replication jobs', () => {
      const jobs = replicationService.getReplicationJobs();
      expect(jobs).toBeDefined();
      expect(Array.isArray(jobs)).toBe(true);
    });

    test('should add replication job', () => {
      const config = {
        sourceDatabase: 'primary',
        targetDatabases: ['secondary'],
        tables: ['test_table'],
        syncKey: 'id',
        intervalMinutes: 60,
        enabled: false
      };

      const jobId = replicationService.addReplicationJob(config);
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');

      const job = replicationService.getReplicationJob(jobId);
      expect(job).toBeDefined();
      expect(job?.config).toEqual(config);
    });
  });
});