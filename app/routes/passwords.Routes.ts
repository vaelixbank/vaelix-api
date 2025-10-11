import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// Create a password
router.post('/', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/passwords',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update a password
router.post('/update', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/passwords/update',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validate a password
router.post('/validate', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/passwords/validate',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initiate lost password process
router.post('/lost', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/passwords/lost',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resume lost password process
router.post('/lost/resume', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/passwords/lost/resume',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;