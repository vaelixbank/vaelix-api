import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// Create a consumer
router.post('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/consumers',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a consumer
router.get('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/consumers/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a consumer
router.patch('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'PATCH',
      `/multi/consumers/${req.params.id}`,
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
      `/multi/consumers/${req.params.id}/root_user/email/verification`,
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
      `/multi/consumers/${req.params.id}/root_user/email/verify`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start KYC for a consumer
router.post('/:id/kyc/start', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/consumers/${req.params.id}/kyc/start`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get KYC for a consumer
router.get('/:id/kyc', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/consumers/${req.params.id}/kyc`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Charge fee to a consumer
router.post('/:id/charge_fee', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/consumers/${req.params.id}/charge_fee`,
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