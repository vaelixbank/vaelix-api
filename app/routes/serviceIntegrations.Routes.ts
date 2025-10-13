import { Router } from 'express';
import { ServiceIntegrationController } from '../controllers/ServiceIntegrationController';
import { authenticateApiKey, requireServerKey } from '../middleware/apiKeyAuth';

const router = Router();

// All service integration routes require server API key (admin access)
router.use(authenticateApiKey);
router.use(requireServerKey);

// Get all service integrations
router.get('/', ServiceIntegrationController.getAllServiceIntegrations);

// Get service integration by name
router.get('/:serviceName', ServiceIntegrationController.getServiceIntegration);

// Create service integration
router.post('/', ServiceIntegrationController.createServiceIntegration);

// Update service integration
router.patch('/:id', ServiceIntegrationController.updateServiceIntegration);

// Delete service integration
router.delete('/:id', ServiceIntegrationController.deleteServiceIntegration);

export default router;