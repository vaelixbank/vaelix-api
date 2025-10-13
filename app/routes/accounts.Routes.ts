import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { WeavrAccountController } from '../controllers/WeavrAccountController';
import { LedgerController } from '../controllers/LedgerController';
import { WeavrService } from '../services/weavrService';
import { validateRequiredFields, validateUUID, validateAccountData } from '../utils/validation';
import { authenticateApiKey, requireServerKey } from '../middleware/apiKeyAuth';

const router = Router();
const weavrService = new WeavrService();
const weavrAccountController = new WeavrAccountController(weavrService);

// DB Operations (require server key for management)
router.use('/db', authenticateApiKey);
router.use('/db', requireServerKey);

// Get all accounts (DB)
router.get('/db', AccountController.getAllAccounts);

// Get accounts by user (DB)
router.get('/db/user/:userId', AccountController.getAccountsByUserId);

// Create an account (DB)
router.post('/db', validateAccountData, AccountController.createAccount);

// Get an account (DB)
router.get('/db/:id', AccountController.getAccountById);

// Update an account (DB)
router.patch('/db/:id', AccountController.updateAccount);

// Delete an account (DB)
router.delete('/db/:id', AccountController.closeAccount);

// Upgrade account to IBAN (DB)
router.post('/db/:id/iban', AccountController.upgradeAccountToIBAN);

// Get account IBAN (DB)
router.get('/db/:id/iban', AccountController.getAccountIBAN);

// Create mirrored account (DB)
router.post('/db/mirror', AccountController.createMirroredAccount);

// Get mirrored accounts for master (DB)
router.get('/db/mirror/:masterAccountId', AccountController.getMirroredAccounts);

// Sync mirror balance (DB)
router.post('/db/mirror/:masterAccountId/:mirroredAccountId/sync', AccountController.syncMirrorBalance);

// Weavr Operations
// Get all managed accounts
router.get('/', (req, res) =>
  weavrAccountController.getAllAccounts(req, res)
);

// Create a managed account
router.post('/', validateRequiredFields(['profile_id']), (req, res) =>
  weavrAccountController.createAccount(req, res)
);

// Get a managed account
router.get('/:id', (req, res) =>
  weavrAccountController.getAccount(req, res)
);

// Update a managed account
router.patch('/:id', (req, res) =>
  weavrAccountController.updateAccount(req, res)
);

// Block a managed account
router.post('/:id/block', (req, res) =>
  weavrAccountController.blockAccount(req, res)
);

// Unblock a managed account
router.post('/:id/unblock', (req, res) =>
  weavrAccountController.unblockAccount(req, res)
);

// Get a managed account statement
router.get('/:id/statement', (req, res) =>
  weavrAccountController.getAccountStatement(req, res)
);

// Upgrade a managed account with IBAN
router.post('/:id/iban', (req, res) =>
  weavrAccountController.upgradeAccountWithIBAN(req, res)
);

// Get a managed account IBAN
router.get('/:id/iban', (req, res) =>
  weavrAccountController.getAccountIBAN(req, res)
);

// Remove a managed account
router.delete('/:id', (req, res) =>
  weavrAccountController.removeAccount(req, res)
);

// Create account with Weavr integration (local + Weavr)
router.post('/integrated', validateRequiredFields(['profile_id', 'user_id']), (req, res) =>
  weavrAccountController.createAccountWithLocal(req, res)
);

// Create master account with vIBAN and initial balance
router.post('/master', validateRequiredFields(['profile_id', 'user_id']), (req, res) =>
  weavrAccountController.createMasterAccount(req, res)
);

// Internal transfers between local accounts (no Weavr involvement)
router.post('/internal-transfer', (req, res) =>
  LedgerController.createInternalTransfer(req, res)
);

export default router;