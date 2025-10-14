// ============================================
// Vaelix Bank API - Open Banking Routes
// ============================================
// Berlin Group API compliant endpoints
// ============================================

import { Router } from 'express';
import { OpenBankingController } from '../controllers/OpenBankingController';
import { authenticateApiKey } from '../middleware/apiKeyAuth';

const router = Router();
const openBankingController = new OpenBankingController();

// ============================================
// Account Information Service (AIS) Routes
// ============================================

/**
 * GET /accounts - Get list of accounts
 */
router.get('/accounts', authenticateApiKey, openBankingController.getAccounts.bind(openBankingController));

/**
 * GET /accounts/{accountId} - Get account details
 */
router.get('/accounts/:accountId', authenticateApiKey, openBankingController.getAccount.bind(openBankingController));

/**
 * GET /accounts/{accountId}/balances - Get account balances
 */
router.get('/accounts/:accountId/balances', authenticateApiKey, openBankingController.getBalances.bind(openBankingController));

/**
 * GET /accounts/{accountId}/transactions - Get account transactions
 */
router.get('/accounts/:accountId/transactions', authenticateApiKey, openBankingController.getTransactions.bind(openBankingController));

// ============================================
// Payment Initiation Service (PIS) Routes
// ============================================

/**
 * POST /payments/{paymentProduct} - Initiate payment
 */
router.post('/payments/:paymentProduct', authenticateApiKey, openBankingController.initiatePayment.bind(openBankingController));

/**
 * GET /payments/{paymentProduct}/{paymentId} - Get payment details
 */
router.get('/payments/:paymentProduct/:paymentId', authenticateApiKey, openBankingController.getPayment.bind(openBankingController));

/**
 * GET /payments/{paymentProduct}/{paymentId}/status - Get payment status
 */
router.get('/payments/:paymentProduct/:paymentId/status', authenticateApiKey, openBankingController.getPaymentStatus.bind(openBankingController));

// ============================================
// Confirmation of Funds (PIIS) Routes
// ============================================

/**
 * POST /funds-confirmations - Check funds availability
 */
router.post('/funds-confirmations', authenticateApiKey, openBankingController.checkFunds.bind(openBankingController));

// ============================================
// Consent Management Routes
// ============================================

/**
 * POST /consents - Create consent
 */
router.post('/consents', authenticateApiKey, openBankingController.createConsent.bind(openBankingController));

/**
 * GET /consents/{consentId} - Get consent details
 */
router.get('/consents/:consentId', authenticateApiKey, openBankingController.getConsent.bind(openBankingController));

/**
 * DELETE /consents/{consentId} - Revoke consent
 */
router.delete('/consents/:consentId', authenticateApiKey, openBankingController.revokeConsent.bind(openBankingController));

// ============================================
// BaaS (Banking as a Service) Routes
// ============================================

/**
 * POST /baas/customers - Create BaaS customer
 */
router.post('/baas/customers', authenticateApiKey, openBankingController.createBaaSCustomer.bind(openBankingController));

/**
 * GET /baas/customers/{customerId} - Get BaaS customer
 */
router.get('/baas/customers/:customerId', authenticateApiKey, openBankingController.getBaaSCustomer.bind(openBankingController));

/**
 * POST /baas/customers/{customerId}/accounts - Create BaaS account
 */
router.post('/baas/customers/:customerId/accounts', authenticateApiKey, openBankingController.createBaaSAccount.bind(openBankingController));

/**
 * POST /baas/accounts/{accountId}/transactions - Create transaction
 */
router.post('/baas/accounts/:accountId/transactions', authenticateApiKey, openBankingController.createBaaSTransaction.bind(openBankingController));

export default router;