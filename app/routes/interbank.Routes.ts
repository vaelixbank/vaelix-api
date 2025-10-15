import { Router } from 'express';
import { interbankController } from '../controllers/InterbankController';
import { validateApiKey, validateAuthToken } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(validateApiKey);
router.use(validateAuthToken);

// ===== SEPA TRANSFERS =====

// Initiate SEPA transfer (SCT/SDD)
router.post('/sepa/transfers', interbankController.initiateSEPATransfer.bind(interbankController));

// ===== SWIFT TRANSFERS =====

// Initiate SWIFT transfer (MT103/MT202/pacs.008)
router.post('/swift/transfers', interbankController.initiateSWIFTTransfer.bind(interbankController));

// ===== TRANSFER MANAGEMENT =====

// Get transfer status
router.get('/transfers/:transfer_id', interbankController.getTransferStatus.bind(interbankController));

// ===== VALIDATION ENDPOINTS =====

// Validate IBAN
router.post('/validate/iban', interbankController.validateIBAN.bind(interbankController));

// Validate BIC
router.post('/validate/bic', interbankController.validateBIC.bind(interbankController));

export default router;