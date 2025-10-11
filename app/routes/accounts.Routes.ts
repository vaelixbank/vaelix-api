import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { weavrService } from '../services/weavrService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all managed accounts
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const accounts = await weavrService.makeRequest(
      'GET',
      '/multi/managed_accounts',
      undefined,
      req.apiKey,
      req.authToken
    );
    res.json(accounts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a managed account
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const account = await weavrService.makeRequest(
      'POST',
      '/multi/managed_accounts',
      req.body,
      req.apiKey,
      req.authToken
    );
    res.status(201).json(account);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a managed account
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const account = await weavrService.makeRequest(
      'GET',
      `/multi/managed_accounts/${req.params.id}`,
      undefined,
      req.apiKey,
      req.authToken
    );
    res.json(account);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a managed account
router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const account = await weavrService.makeRequest(
      'PATCH',
      `/multi/managed_accounts/${req.params.id}`,
      req.body,
      req.apiKey,
      req.authToken
    );
    res.json(account);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Block a managed account
router.post('/:id/block', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/managed_accounts/${req.params.id}/block`,
      req.body,
      req.apiKey,
      req.authToken
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock a managed account
router.post('/:id/unblock', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/managed_accounts/${req.params.id}/unblock`,
      req.body,
      req.apiKey,
      req.authToken
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get managed account statement
router.get('/:id/statement', async (req: AuthenticatedRequest, res) => {
  try {
    const statement = await weavrService.makeRequest(
      'GET',
      `/multi/managed_accounts/${req.params.id}/statement`,
      undefined,
      req.apiKey,
      req.authToken
    );
    res.json(statement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upgrade managed account with IBAN
router.post('/:id/iban', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/managed_accounts/${req.params.id}/iban`,
      req.body,
      req.apiKey,
      req.authToken
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get managed account IBAN
router.get('/:id/iban', async (req: AuthenticatedRequest, res) => {
  try {
    const iban = await weavrService.makeRequest(
      'GET',
      `/multi/managed_accounts/${req.params.id}/iban`,
      undefined,
      req.apiKey,
      req.authToken
    );
    res.json(iban);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a managed account
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/managed_accounts/${req.params.id}/remove`,
      req.body,
      req.apiKey,
      req.authToken
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;