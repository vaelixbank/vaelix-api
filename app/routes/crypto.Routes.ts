import { Router } from 'express';
import { cryptoController } from '../controllers/cryptoController';
import { validateApiKey, validateAuthToken } from '../utils/validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(validateApiKey);
router.use(validateAuthToken);

// ===== WALLET MANAGEMENT =====

// Create crypto wallet
router.post('/wallets', cryptoController.createWallet.bind(cryptoController));

// Get wallet balance
router.get('/wallets/:wallet_id/balance', cryptoController.getWalletBalance.bind(cryptoController));

// ===== TRANSACTIONS =====

// Send crypto transaction
router.post('/transactions/send', cryptoController.sendTransaction.bind(cryptoController));

// Get transaction history
router.get('/wallets/:wallet_id/transactions', cryptoController.getTransactionHistory.bind(cryptoController));

// ===== EXCHANGE =====

// Get exchange rates
router.get('/exchange/rates', cryptoController.getExchangeRates.bind(cryptoController));

// Buy crypto
router.post('/exchange/buy', cryptoController.buyCrypto.bind(cryptoController));

// Sell crypto
router.post('/exchange/sell', cryptoController.sellCrypto.bind(cryptoController));

// Swap crypto
router.post('/exchange/swap', cryptoController.swapCrypto.bind(cryptoController));

// Get supported trading pairs
router.get('/exchange/pairs', cryptoController.getSupportedPairs.bind(cryptoController));

// ===== KYC & COMPLIANCE =====

// Submit KYC for crypto
router.post('/kyc/submit', cryptoController.submitKyc.bind(cryptoController));

// ===== UTILITIES =====

// Validate crypto address
router.post('/validate/address', cryptoController.validateAddress.bind(cryptoController));

export default router;