import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { authenticateApiKey, requireServerKey } from '../middleware/apiKeyAuth';
import { validateRequiredFields, validateApiKeyData } from '../utils/validation';

const router = Router();

// Public routes (no auth required)
router.post('/validate', ApiKeyController.validateApiKey);

// Protected routes (require server key for management)
router.use(authenticateApiKey);
router.use(requireServerKey);

// Get all API keys (server only)
router.get('/', ApiKeyController.getAllApiKeys);

// Get API keys by user
router.get('/user/:userId', ApiKeyController.getApiKeysByUser);

// Create a new API key
router.post('/', validateApiKeyData, ApiKeyController.createApiKey);

// Update an API key
router.patch('/:id', ApiKeyController.updateApiKey);

// Delete an API key
router.delete('/:id', ApiKeyController.deleteApiKey);

export default router;