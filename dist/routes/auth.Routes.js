"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const weavrService_1 = require("../services/weavrService");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
const weavrService = new weavrService_1.WeavrService();
const authController = new AuthController_1.AuthController(weavrService);
// Login with password
router.post('/login', (0, validation_1.validateRequiredFields)(['identifier', 'password']), (req, res) => authController.login(req, res));
// Login via biometrics
router.post('/login/biometric', (0, validation_1.validateRequiredFields)(['identifier', 'biometric_token']), (req, res) => authController.loginBiometric(req, res));
// Get user identities
router.get('/identities', (req, res) => authController.getUserIdentities(req, res));
// Logout
router.post('/logout', (req, res) => authController.logout(req, res));
// Acquire a new access token
router.post('/token', (req, res) => authController.requestAccessToken(req, res));
exports.default = router;
