import { Router } from 'express';
import { RegulatoryController } from '../controllers/RegulatoryController';
import { RegulatoryGateway } from '../core/RegulatoryGateway';
import { WeavrService } from '../services/weavrService';
import { validateRequiredFields } from '../utils/validation';

const router = Router();
const weavrService = new WeavrService();
const regulatoryGateway = new RegulatoryGateway(weavrService);
const regulatoryController = new RegulatoryController(regulatoryGateway);

// =========================================
// REGULATORY OPERATIONS - LIMITED WEAVR INTERACTION
// =========================================

// Process any transaction through central TransactionManager
router.post('/transactions', regulatoryController.processTransaction);

// Generate IBAN for regulatory compliance
router.post('/iban/generate', validateRequiredFields(['account_id']), regulatoryController.generateIBAN);

// Send external payment through regulatory gateway
router.post('/payments/send', validateRequiredFields(['from_account_id', 'amount', 'beneficiary_details']), regulatoryController.sendExternalPayment);

// Confirm external receive (typically called by webhooks)
router.post('/payments/confirm-receive', validateRequiredFields(['local_transaction_id', 'weavr_reference']), regulatoryController.confirmExternalReceive);

// Get account IBAN details
router.get('/accounts/:account_id/iban', regulatoryController.getAccountIBAN);

// Administrative balance adjustment (restricted access)
router.post('/balances/adjust', validateRequiredFields(['account_id', 'amount']), regulatoryController.adjustBalance);

export default router;