"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weavrService_1 = require("../services/weavrService");
const router = (0, express_1.Router)();
// Create a corporate
router.post('/', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/corporates', req.body, req.headers['x-api-key'] || req.headers['api_key']);
        res.status(201).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a corporate
router.get('/:id', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', `/multi/corporates/${req.params.id}`, undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a corporate
router.patch('/:id', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('PATCH', `/multi/corporates/${req.params.id}`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Send an email verification code to the root user
router.post('/:id/root_user/email/verification', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/corporates/${req.params.id}/root_user/email/verification`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Verify email of the root user
router.post('/:id/root_user/email/verify', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/corporates/${req.params.id}/root_user/email/verify`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Start KYB for a corporate
router.post('/:id/kyb/start', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/corporates/${req.params.id}/kyb/start`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get KYB for a corporate
router.get('/:id/kyb', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', `/multi/corporates/${req.params.id}/kyb`, undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Charge fee to a corporate
router.post('/:id/charge_fee', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/corporates/${req.params.id}/charge_fee`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
