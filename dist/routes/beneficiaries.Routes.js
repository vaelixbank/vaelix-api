"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weavrService_1 = require("../services/weavrService");
const router = (0, express_1.Router)();
// Add beneficiaries
router.post('/batch', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/beneficiaries/batch', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all beneficiaries
router.get('/', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', '/multi/beneficiaries', undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Remove beneficiaries
router.post('/batch/remove', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/beneficiaries/batch/remove', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a beneficiary
router.get('/:id', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', `/multi/beneficiaries/${req.params.id}`, undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get all beneficiary batches
router.get('/batch', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', '/multi/beneficiaries/batch', undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a beneficiary batch
router.get('/batch/:id', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', `/multi/beneficiaries/batch/${req.params.id}`, undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Issue a one-time password to verify a beneficiary batch
router.post('/batch/:id/sca/otp', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/beneficiaries/batch/${req.params.id}/sca/otp`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Verify a beneficiary batch using a one-time password
router.post('/batch/:id/sca/otp/verify', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/beneficiaries/batch/${req.params.id}/sca/otp/verify`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Issue a push notification that can be used to verify a beneficiary batch
router.post('/batch/:id/sca/push', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/beneficiaries/batch/${req.params.id}/sca/push`, req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
