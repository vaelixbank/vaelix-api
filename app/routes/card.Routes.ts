import { Router } from 'express';
import { CardController } from '../controllers/CardController';
import { WeavrService } from '../services/weavrService';
import { PushProvisioningService } from '../services/pushProvisioningService';
import { weavrSyncService } from '../services/weavrSyncService';
import { validateRequiredFields } from '../utils/validation';

const router = Router();
const weavrService = new WeavrService();
const pushProvisioningService = new PushProvisioningService(weavrService);
const cardController = new CardController(weavrService, pushProvisioningService);

// Get all managed cards
router.get('/', (req, res) =>
  cardController.getAllCards(req, res)
);

// Create a managed card
router.post('/', validateRequiredFields(['profile_id', 'type', 'currency']), (req, res) =>
  cardController.createCard(req, res)
);

// Get a managed card
router.get('/:id', (req, res) =>
  cardController.getCard(req, res)
);

// Update a managed card
router.patch('/:id', (req, res) =>
  cardController.updateCard(req, res)
);

// Block a managed card
router.post('/:id/block', (req, res) =>
  cardController.blockCard(req, res)
);

// Unblock a managed card
router.post('/:id/unblock', (req, res) =>
  cardController.unblockCard(req, res)
);

// Remove a managed card
router.delete('/:id', (req, res) =>
  cardController.removeCard(req, res)
);

// Get managed card statement
router.get('/:id/statement', (req, res) =>
  cardController.getCardStatement(req, res)
);

// Assign a managed card
router.post('/:id/assign', (req, res) =>
  cardController.assignCard(req, res)
);

// Get spend rules for a managed card
router.get('/:id/spend-rules', (req, res) =>
  cardController.getSpendRules(req, res)
);

// Create spend rules for a managed card
router.post('/:id/spend-rules', (req, res) =>
  cardController.createSpendRules(req, res)
);

// Update spend rules for a managed card
router.patch('/:id/spend-rules', (req, res) =>
  cardController.updateSpendRules(req, res)
);

// Delete all spend rules for a managed card
router.delete('/:id/spend-rules', (req, res) =>
  cardController.deleteSpendRules(req, res)
);

// Get wallet details for a managed card
router.get('/:id/wallet-details', (req, res) =>
  cardController.getCardWalletDetails(req, res)
);

// Get wallet details for a managed card
router.get('/:id/wallet-details', (req, res) =>
  cardController.getCardWalletDetails(req, res)
);

// Check provisioning eligibility
router.get('/:id/provisioning/eligibility', (req, res) =>
  cardController.checkProvisioningEligibility(req, res)
);

// Provision card for Apple Pay
router.post('/:id/provisioning/apple-pay', validateRequiredFields(['certificates', 'nonce', 'nonceSignature']), (req, res) =>
  cardController.provisionForApplePay(req, res)
);

// Provision card for Google Pay
router.post('/:id/provisioning/google-pay', validateRequiredFields(['clientDeviceId', 'clientWalletAccountId']), (req, res) =>
  cardController.provisionForGooglePay(req, res)
);

// Get provisioning status
router.get('/:id/provisioning/status', (req, res) =>
  cardController.getProvisioningStatus(req, res)
);

// Get provisioning history
router.get('/:id/provisioning/history', (req, res) =>
  cardController.getProvisioningHistory(req, res)
);

// Revoke provisioning
router.post('/:id/provisioning/revoke', validateRequiredFields(['walletType']), (req, res) =>
  cardController.revokeProvisioning(req, res)
);

// Webhook for card authorization forwarding
router.post('/authorisation-forwarding', async (req, res) => {
  try {
    const event = req.body;
    await weavrSyncService.processWebhookEvent(event);
    res.status(200).json({ result: 'APPROVED' }); // Default response
  } catch (error: any) {
    console.error('Authorization forwarding error:', error);
    res.status(200).json({ result: 'DECLINED' }); // Fail-safe
  }
});

export default router;