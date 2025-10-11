"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const weavrService_1 = require("../services/weavrService");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Get all managed accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await weavrService_1.weavrService.makeRequest('GET', '/multi/managed_accounts', undefined, req.apiKey, req.authToken);
        res.json(accounts);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create a managed account
router.post('/', async (req, res) => {
    try {
        const account = await weavrService_1.weavrService.makeRequest('POST', '/multi/managed_accounts', req.body, req.apiKey, req.authToken);
        res.status(201).json(account);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a managed account
router.get('/:id', async (req, res) => {
    try {
        const account = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_accounts/${req.params.id}`, undefined, req.apiKey, req.authToken);
        res.json(account);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a managed account
router.patch('/:id', async (req, res) => {
    try {
        const account = await weavrService_1.weavrService.makeRequest('PATCH', `/multi/managed_accounts/${req.params.id}`, req.body, req.apiKey, req.authToken);
        res.json(account);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Block a managed account
router.post('/:id/block', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/block`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Unblock a managed account
router.post('/:id/unblock', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/unblock`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get managed account statement
router.get('/:id/statement', async (req, res) => {
    try {
        const statement = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_accounts/${req.params.id}/statement`, undefined, req.apiKey, req.authToken);
        res.json(statement);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Upgrade managed account with IBAN
router.post('/:id/iban', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/iban`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get managed account IBAN
router.get('/:id/iban', async (req, res) => {
    try {
        const iban = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_accounts/${req.params.id}/iban`, undefined, req.apiKey, req.authToken);
        res.json(iban);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Remove a managed account
router.delete('/:id', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/remove`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
