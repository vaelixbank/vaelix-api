"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weavrService_1 = require("../services/weavrService");
const router = (0, express_1.Router)();
// Login with password
router.post('/login', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/access/login', req.body, req.headers['x-api-key'] || req.headers['api_key']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Login via biometrics
router.post('/login/biometric', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/access/login/biometric', req.body, req.headers['x-api-key'] || req.headers['api_key']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get user identities
router.get('/identities', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', '/multi/access/identities', undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Logout
router.post('/logout', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/access/logout', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Acquire a new access token
router.post('/token', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/access/token', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
