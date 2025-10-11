import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// Create a user
router.post('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/users',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/users',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a user
router.get('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/users/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a user
router.patch('/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'PATCH',
      `/multi/users/${req.params.id}`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Activate a user
router.post('/:id/activate', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/users/${req.params.id}/activate`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate a user
router.post('/:id/deactivate', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/users/${req.params.id}/deactivate`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send a user invite
router.post('/invite', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/users/invite',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate a user invite
router.post('/invite/validate', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/users/invite/validate',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Consume a user invite
router.post('/invite/consume', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/users/invite/consume',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send an email verification code to the authorised user
router.post('/:id/email/verification', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/users/${req.params.id}/email/verification`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify email of the authorised user
router.post('/:id/email/verify', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/users/${req.params.id}/email/verify`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start KYC for the user
router.post('/:id/kyc', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/users/${req.params.id}/kyc`,
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