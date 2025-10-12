"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApiKeyController_1 = require("../controllers/ApiKeyController");
const apiKeyAuth_1 = require("../middleware/apiKeyAuth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
// Public routes (no auth required)
router.post('/validate', ApiKeyController_1.ApiKeyController.validateApiKey);
// Protected routes (require server key for management)
router.use(apiKeyAuth_1.authenticateApiKey);
router.use(apiKeyAuth_1.requireServerKey);
// Get all API keys (server only)
router.get('/', ApiKeyController_1.ApiKeyController.getAllApiKeys);
// Get API keys by user
router.get('/user/:userId', ApiKeyController_1.ApiKeyController.getApiKeysByUser);
// Create a new API key
router.post('/', validation_1.validateApiKeyData, ApiKeyController_1.ApiKeyController.createApiKey);
// Update an API key
router.patch('/:id', ApiKeyController_1.ApiKeyController.updateApiKey);
// Delete an API key
router.delete('/:id', ApiKeyController_1.ApiKeyController.deleteApiKey);
exports.default = router;
