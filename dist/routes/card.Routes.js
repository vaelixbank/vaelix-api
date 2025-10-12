"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CardController_1 = require("../controllers/CardController");
const weavrService_1 = require("../services/weavrService");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
const weavrService = new weavrService_1.WeavrService();
const cardController = new CardController_1.CardController(weavrService);
// Get all managed cards
router.get('/', (req, res) => cardController.getAllCards(req, res));
// Create a managed card
router.post('/', (0, validation_1.validateRequiredFields)(['profile_id', 'type', 'currency']), (req, res) => cardController.createCard(req, res));
// Get a managed card
router.get('/:id', (req, res) => cardController.getCard(req, res));
// Update a managed card
router.patch('/:id', (req, res) => cardController.updateCard(req, res));
// Block a managed card
router.post('/:id/block', (req, res) => cardController.blockCard(req, res));
// Unblock a managed card
router.post('/:id/unblock', (req, res) => cardController.unblockCard(req, res));
// Remove a managed card
router.delete('/:id', (req, res) => cardController.removeCard(req, res));
// Get managed card statement
router.get('/:id/statement', (req, res) => cardController.getCardStatement(req, res));
// Assign a managed card
router.post('/:id/assign', (req, res) => cardController.assignCard(req, res));
// Get spend rules for a managed card
router.get('/:id/spend-rules', (req, res) => cardController.getSpendRules(req, res));
// Create spend rules for a managed card
router.post('/:id/spend-rules', (req, res) => cardController.createSpendRules(req, res));
// Update spend rules for a managed card
router.patch('/:id/spend-rules', (req, res) => cardController.updateSpendRules(req, res));
// Delete all spend rules for a managed card
router.delete('/:id/spend-rules', (req, res) => cardController.deleteSpendRules(req, res));
exports.default = router;
