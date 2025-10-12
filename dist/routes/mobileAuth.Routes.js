"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MobileAuthController_1 = require("../controllers/MobileAuthController");
const mobileAuth_1 = require("../middleware/mobileAuth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post('/register', mobileAuth_1.validateDeviceId, (0, validation_1.validateRequiredFields)(['email', 'phone', 'full_name', 'password']), MobileAuthController_1.MobileAuthController.register);
router.post('/login', mobileAuth_1.validateDeviceId, (0, validation_1.validateRequiredFields)(['email', 'device_id']), MobileAuthController_1.MobileAuthController.login);
router.post('/refresh', (0, validation_1.validateRequiredFields)(['refresh_token']), MobileAuthController_1.MobileAuthController.refreshToken);
router.post('/password-reset', (0, validation_1.validateRequiredFields)(['email']), MobileAuthController_1.MobileAuthController.passwordResetRequest);
router.post('/password-reset/confirm', (0, validation_1.validateRequiredFields)(['token', 'new_password']), MobileAuthController_1.MobileAuthController.passwordResetConfirm);
// Protected routes (authentication required)
router.use(mobileAuth_1.authenticateMobileUser);
router.post('/logout', MobileAuthController_1.MobileAuthController.logout);
router.post('/verify/send', (0, validation_1.validateRequiredFields)(['type']), MobileAuthController_1.MobileAuthController.sendVerification);
router.post('/verify', (0, validation_1.validateRequiredFields)(['code', 'type']), MobileAuthController_1.MobileAuthController.verifyCode);
router.get('/profile', MobileAuthController_1.MobileAuthController.getProfile);
// Routes requiring verified account
router.use(mobileAuth_1.requireVerifiedUser);
// Add verified-only routes here
// router.get('/accounts', ...);
// router.post('/transfer', ...);
exports.default = router;
