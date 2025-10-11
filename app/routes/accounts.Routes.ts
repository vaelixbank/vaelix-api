import { Router } from 'express';
import { AccountController } from '../controllers/AccountController';
import { WeavrService } from '../services/weavrService';
import { validateRequiredFields, validateUUID } from '../utils/validation';

const router = Router();
const weavrService = new WeavrService();
const accountController = new AccountController(weavrService);

// Get all managed accounts
router.get('/', (req, res) =>
  accountController.getAllAccounts(req, res)
);

// Create a managed account
router.post('/', validateRequiredFields(['profile_id']), (req, res) =>
  accountController.createAccount(req, res)
);

// Get a managed account
router.get('/:id', (req, res) =>
  accountController.getAccount(req, res)
);

// Update a managed account
router.patch('/:id', (req, res) =>
  accountController.updateAccount(req, res)
);

// Block a managed account
router.post('/:id/block', (req, res) =>
  accountController.blockAccount(req, res)
);

// Unblock a managed account
router.post('/:id/unblock', (req, res) =>
  accountController.unblockAccount(req, res)
);

// Get a managed account statement
router.get('/:id/statement', (req, res) =>
  accountController.getAccountStatement(req, res)
);

// Upgrade a managed account with IBAN
router.post('/:id/iban', (req, res) =>
  accountController.upgradeAccountWithIBAN(req, res)
);

// Get a managed account IBAN
router.get('/:id/iban', (req, res) =>
  accountController.getAccountIBAN(req, res)
);

// Remove a managed account
router.delete('/:id', (req, res) =>
  accountController.removeAccount(req, res)
);

export default router;