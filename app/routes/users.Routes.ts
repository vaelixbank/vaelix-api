import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { weavrService } from '../services/weavrService';
import { validateUserData } from '../utils/validation';
import { authenticateApiKey, requireServerKey } from '../middleware/apiKeyAuth';

const router = Router();

// DB Operations (require server key for management)
router.use('/db', (req, res, next) => { console.log("DB route middleware called"); next(); });
router.use('/db', requireServerKey);

// Create a user (DB)
router.post('/db', validateUserData, UserController.createUser);

// Get all users (DB)
router.get('/db', UserController.getAllUsers);

// Get a user (DB)
router.get('/db/:id', UserController.getUserById);

// Update a user (DB)
router.patch('/db/:id', UserController.updateUser);

// Delete a user (DB)
router.delete('/db/:id', UserController.deleteUser);

// Weavr Operations
// Create a user (Weavr)
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

// Get all users (Weavr)
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

// Get a user (Weavr)
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

// Update a user (Weavr)
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