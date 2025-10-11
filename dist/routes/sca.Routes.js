"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weavrService_1 = require("../services/weavrService");
const router = (0, express_1.Router)();
// ===== AUTHENTICATION FACTORS =====
// Get user authentication factors
router.get('/factors', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('GET', '/multi/auth_factors', undefined, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Enrol a user device for authentication using one-time passwords (step 1)
router.post('/factors/otp/enrol', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/auth_factors/otp/enrol/step1', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Verify enrolment of a user device for authentication using one-time passwords (step 2)
router.post('/factors/otp/enrol/verify', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/auth_factors/otp/enrol/step2', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Enrol a user device for authentication using push notifications
router.post('/factors/push/enrol', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/auth_factors/push/enrol', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Unlink a user device for authentication using push notifications
router.delete('/factors/push/unlink', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('DELETE', '/multi/auth_factors/push/unlink', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ===== STEP-UP CHALLENGES =====
// Issue a one-time password that can be used to step-up a token
router.post('/challenges/stepup/otp', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/stepup/challenges/otp', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Verify a step-up token using a one-time password
router.post('/challenges/stepup/otp/verify', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/stepup/challenges/otp/verify', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Issue a push notification that can be used to step-up a token
router.post('/challenges/stepup/push', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/stepup/challenges/push', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ===== CONFIRMATION CHALLENGES =====
// Issue a one-time password that can be used to verify a list of resources
router.post('/challenges/confirmation/otp', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/confirmation/challenges/otp', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Verify a list of resources using a one-time password
router.post('/challenges/confirmation/otp/verify', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/confirmation/challenges/otp/verify', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Issue a push notification that can be used to verify a list of resources
router.post('/challenges/confirmation/push', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', '/multi/confirmation/challenges/push', req.body, req.headers['x-api-key'] || req.headers['api_key'], req.headers['authorization'] || req.headers['auth_token']);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
