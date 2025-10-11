import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// Create a corporate
router.post('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/corporates',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a corporate
router.get('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/corporates/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a corporate
router.patch('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'PATCH',
      `/multi/corporates/${req.params.id}`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send an email verification code to the root user
router.post('/:id/root_user/email/verification', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/corporates/${req.params.id}/root_user/email/verification`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify email of the root user
router.post('/:id/root_user/email/verify', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/corporates/${req.params.id}/root_user/email/verify`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start KYB for a corporate
router.post('/:id/kyb/start', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/corporates/${req.params.id}/kyb/start`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get KYB for a corporate
router.get('/:id/kyb', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/corporates/${req.params.id}/kyb`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Charge fee to a corporate
router.post('/:id/charge_fee', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/corporates/${req.params.id}/charge_fee`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;