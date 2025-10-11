"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const weavrService_1 = require("../services/weavrService");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_1.authenticate);
// Get all managed cards
router.get('/', async (req, res) => {
    try {
        const cards = await weavrService_1.weavrService.makeRequest('GET', '/multi/managed_cards', undefined, req.apiKey, req.authToken);
        res.json(cards);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create a managed card
router.post('/', async (req, res) => {
    try {
        const card = await weavrService_1.weavrService.makeRequest('POST', '/multi/managed_cards', req.body, req.apiKey, req.authToken);
        res.status(201).json(card);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a managed card
router.get('/:id', async (req, res) => {
    try {
        const card = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}`, undefined, req.apiKey, req.authToken);
        res.json(card);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update a managed card
router.patch('/:id', async (req, res) => {
    try {
        const card = await weavrService_1.weavrService.makeRequest('PATCH', `/multi/managed_cards/${req.params.id}`, req.body, req.apiKey, req.authToken);
        res.json(card);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Block a managed card
router.post('/:id/block', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/block`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Unblock a managed card
router.post('/:id/unblock', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/unblock`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Remove a managed card
router.delete('/:id', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/remove`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get managed card statement
router.get('/:id/statement', async (req, res) => {
    try {
        const statement = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}/statement`, undefined, req.apiKey, req.authToken);
        res.json(statement);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Assign a managed card
router.post('/:id/assign', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/assign`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get spend rules for a managed card
router.get('/:id/spend-rules', async (req, res) => {
    try {
        const rules = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, undefined, req.apiKey, req.authToken);
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Create spend rules for a managed card
router.post('/:id/spend-rules', async (req, res) => {
    try {
        const rules = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, req.body, req.apiKey, req.authToken);
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update spend rules for a managed card
router.patch('/:id/spend-rules', async (req, res) => {
    try {
        const rules = await weavrService_1.weavrService.makeRequest('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, req.body, req.apiKey, req.authToken);
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete spend rules for a managed card
router.delete('/:id/spend-rules', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, undefined, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Upgrade card to physical
router.post('/:id/physical', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Activate physical card
router.post('/:id/physical/activate', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical/activate`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get PIN for physical card
router.get('/:id/physical/pin', async (req, res) => {
    try {
        const pin = await weavrService_1.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}/physical/pin`, undefined, req.apiKey, req.authToken);
        res.json(pin);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Unblock PIN for physical card
router.patch('/:id/physical/pin/unblock', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('PATCH', `/multi/managed_cards/${req.params.id}/physical/pin/unblock`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Replace damaged physical card
router.post('/:id/physical/replace/damaged', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical/replace/damaged`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Report physical card as lost
router.post('/:id/physical/report/lost', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical/report/lost`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Report physical card as stolen
router.post('/:id/physical/report/stolen', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical/report/stolen`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Replace lost or stolen physical card
router.post('/:id/physical/replace/lost-stolen', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical/replace/lost_stolen`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Reset contactless limit for physical card
router.post('/:id/physical/contactless-limit/reset', async (req, res) => {
    try {
        const result = await weavrService_1.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/physical/contactless_limit/reset`, req.body, req.apiKey, req.authToken);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
