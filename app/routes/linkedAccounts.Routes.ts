import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// Add a linked account
router.post('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/linked_accounts',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all linked accounts
router.get('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/linked_accounts',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a linked account
router.get('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/linked_accounts/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a linked account
router.patch('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'PATCH',
      `/multi/linked_accounts/${req.params.id}`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a linked account
router.post('/:id/remove', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/linked_accounts/${req.params.id}/remove`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Block a linked account
router.post('/:id/block', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/linked_accounts/${req.params.id}/block`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock a linked account
router.post('/:id/unblock', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/linked_accounts/${req.params.id}/unblock`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get linked account verifications
router.get('/verifications', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/linked_accounts/verifications',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;