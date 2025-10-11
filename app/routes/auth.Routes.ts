import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// Login with password
router.post('/login', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/access/login',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login via biometrics
router.post('/login/biometric', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/access/login/biometric',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get user identities
router.get('/identities', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/access/identities',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/access/logout',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Acquire a new access token
router.post('/token', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/access/token',
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