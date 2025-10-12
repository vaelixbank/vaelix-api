"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AccountController_1 = require("../controllers/AccountController");
const WeavrAccountController_1 = require("../controllers/WeavrAccountController");
const weavrService_1 = require("../services/weavrService");
const validation_1 = require("../utils/validation");
const apiKeyAuth_1 = require("../middleware/apiKeyAuth");
const router = (0, express_1.Router)();
const weavrService = new weavrService_1.WeavrService();
const weavrAccountController = new WeavrAccountController_1.WeavrAccountController(weavrService);
// DB Operations (require server key for management)
router.use('/db', apiKeyAuth_1.authenticateApiKey);
router.use('/db', apiKeyAuth_1.requireServerKey);
// Get all accounts (DB)
router.get('/db', AccountController_1.AccountController.getAllAccounts);
// Get accounts by user (DB)
router.get('/db/user/:userId', AccountController_1.AccountController.getAccountsByUserId);
// Create an account (DB)
router.post('/db', validation_1.validateAccountData, AccountController_1.AccountController.createAccount);
// Get an account (DB)
router.get('/db/:id', AccountController_1.AccountController.getAccountById);
// Update an account (DB)
router.patch('/db/:id', AccountController_1.AccountController.updateAccount);
// Delete an account (DB)
router.delete('/db/:id', AccountController_1.AccountController.closeAccount);
// Upgrade account to IBAN (DB)
router.post('/db/:id/iban', AccountController_1.AccountController.upgradeAccountToIBAN);
// Get account IBAN (DB)
router.get('/db/:id/iban', AccountController_1.AccountController.getAccountIBAN);
// Weavr Operations
// Get all managed accounts
router.get('/', (req, res) => weavrAccountController.getAllAccounts(req, res));
// Create a managed account
router.post('/', (0, validation_1.validateRequiredFields)(['profile_id']), (req, res) => weavrAccountController.createAccount(req, res));
// Get a managed account
router.get('/:id', (req, res) => weavrAccountController.getAccount(req, res));
// Update a managed account
router.patch('/:id', (req, res) => weavrAccountController.updateAccount(req, res));
// Block a managed account
router.post('/:id/block', (req, res) => weavrAccountController.blockAccount(req, res));
// Unblock a managed account
router.post('/:id/unblock', (req, res) => weavrAccountController.unblockAccount(req, res));
// Get a managed account statement
router.get('/:id/statement', (req, res) => weavrAccountController.getAccountStatement(req, res));
// Upgrade a managed account with IBAN
router.post('/:id/iban', (req, res) => weavrAccountController.upgradeAccountWithIBAN(req, res));
// Get a managed account IBAN
router.get('/:id/iban', (req, res) => weavrAccountController.getAccountIBAN(req, res));
// Remove a managed account
router.delete('/:id', (req, res) => weavrAccountController.removeAccount(req, res));
exports.default = router;
