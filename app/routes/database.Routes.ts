import { Router } from 'express';
import { DatabaseController } from '../controllers/DatabaseController';
import { authenticateApiKey, requireDatabaseKey, routeToDatabase, requireHealthyDatabase } from '../middleware/apiKeyAuth';

const router = Router();

// All database routes require authentication and database key
router.use(authenticateApiKey);
router.use(requireDatabaseKey);
router.use(routeToDatabase);
router.use(requireHealthyDatabase);

// Execute a single query on the routed database
router.post('/query', DatabaseController.executeQuery);

// Execute multiple queries in a transaction
router.post('/transaction', DatabaseController.executeTransaction);

// Execute federated queries across multiple databases
router.post('/federated-query', DatabaseController.executeFederatedQuery);

// Get database information and health status
router.get('/info', DatabaseController.getDatabaseInfo);

// Get database schema information
router.get('/schema', DatabaseController.getSchemaInfo);

// Health check for the routed database
router.get('/health', DatabaseController.healthCheck);

// Get all databases status (admin only - requires server key)
router.get('/status',
  requireDatabaseKey, // This will be overridden by server key check
  DatabaseController.getDatabaseInfo
);

// Replication management routes
router.get('/replication/jobs', DatabaseController.getReplicationJobs);
router.post('/replication/jobs', DatabaseController.createReplicationJob);
router.post('/replication/jobs/:jobId/run', DatabaseController.runReplicationNow);
router.post('/replication/table', DatabaseController.replicateTableNow);

export default router;