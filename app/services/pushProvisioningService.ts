import crypto from 'crypto';
import { WeavrService } from './weavrService';
import { CardQueries } from '../queries/cardQueries';
import { logger } from '../utils/logger';
import {
  ApplePayProvisioningRequest,
  ApplePayProvisioningResponse,
  GooglePayProvisioningRequest,
  GooglePayProvisioningResponse,
  CardProvisioning
} from '../models/Card';

export class PushProvisioningService {
  private weavrService: WeavrService;

  constructor(weavrService: WeavrService) {
    this.weavrService = weavrService;
  }

  /**
   * Check if a card is eligible for wallet provisioning
   */
  async checkEligibility(cardId: string, walletType: 'apple_pay' | 'google_pay'): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      // Check if card exists and is active
      const card = await CardQueries.getCardByVibanId(cardId);
      if (!card || card.status !== 'active') {
        return { eligible: false, reason: 'Card not found or not active' };
      }

      // Check if already provisioned
      const existingProvisioning = await CardQueries.getProvisioningRecord(cardId, walletType);
      if (existingProvisioning && existingProvisioning.status === 'success') {
        return { eligible: false, reason: 'Card already provisioned for this wallet' };
      }

      // Additional eligibility checks can be added here
      // e.g., card type, issuer, geographic restrictions, etc.

      return { eligible: true };
    } catch (error) {
      logger.error('Error checking provisioning eligibility', { error, cardId, walletType });
      return { eligible: false, reason: 'Eligibility check failed' };
    }
  }

  /**
   * Provision card for Apple Pay
   */
  async provisionForApplePay(
    cardId: string,
    request: ApplePayProvisioningRequest,
    apiKey: string,
    authToken: string
  ): Promise<ApplePayProvisioningResponse> {
    try {
      logger.info('Starting Apple Pay provisioning', { cardId });

      // Check eligibility
      const eligibility = await this.checkEligibility(cardId, 'apple_pay');
      if (!eligibility.eligible) {
        throw new Error(`Card not eligible for Apple Pay: ${eligibility.reason}`);
      }

      // Create provisioning record
      const provisioningRecord = await CardQueries.createProvisioningRecord(cardId, 'apple_pay');
      await CardQueries.updateProvisioningStatus(provisioningRecord.id, 'processing');

      // Validate certificates
      await this.validateApplePayCertificates(request.certificates);

      // Get card details from Weavr
      const cardDetails = await this.weavrService.getCardForWallet(cardId, apiKey, authToken);

      // Generate encrypted payment data
      const encryptedData = await this.generateApplePayEncryptedData(cardDetails, request);

      // Create response
      const response: ApplePayProvisioningResponse = {
        cards: [{
          suffix: cardDetails.card_number.slice(-4),
          expirationMonth: cardDetails.expiry_month,
          expirationYear: cardDetails.expiry_year,
          cardholderName: cardDetails.name_on_card,
          paymentData: encryptedData
        }]
      };

      // Update provisioning status to success
      await CardQueries.updateProvisioningStatus(provisioningRecord.id, 'success');

      logger.info('Apple Pay provisioning completed successfully', { cardId });
      return response;

    } catch (error: any) {
      logger.error('Apple Pay provisioning failed', { error: error.message, cardId });

      // Update provisioning status to failed
      const provisioningRecord = await CardQueries.getProvisioningRecord(cardId, 'apple_pay');
      if (provisioningRecord) {
        await CardQueries.updateProvisioningStatus(provisioningRecord.id, 'failed', error.message);
      }

      throw error;
    }
  }

  /**
   * Provision card for Google Pay
   */
  async provisionForGooglePay(
    cardId: string,
    request: GooglePayProvisioningRequest,
    apiKey: string,
    authToken: string
  ): Promise<GooglePayProvisioningResponse> {
    try {
      logger.info('Starting Google Pay provisioning', { cardId });

      // Check eligibility
      const eligibility = await this.checkEligibility(cardId, 'google_pay');
      if (!eligibility.eligible) {
        throw new Error(`Card not eligible for Google Pay: ${eligibility.reason}`);
      }

      // Create provisioning record
      const provisioningRecord = await CardQueries.createProvisioningRecord(
        cardId,
        'google_pay',
        request.clientDeviceId,
        request.clientWalletAccountId
      );
      await CardQueries.updateProvisioningStatus(provisioningRecord.id, 'processing');

      // Get card details from Weavr
      const cardDetails = await this.weavrService.getCardForWallet(cardId, apiKey, authToken);

      // Generate Google Pay response
      const response: GooglePayProvisioningResponse = {
        paymentCard: {
          cardNumber: cardDetails.card_number,
          expirationMonth: cardDetails.expiry_month,
          expirationYear: cardDetails.expiry_year,
          cardholderName: cardDetails.name_on_card,
          authMethod: 'PAN_ONLY', // or 'CRYPTOGRAM_3DS' for tokenized
          fpanLastFour: cardDetails.card_number.slice(-4)
        }
      };

      // Update provisioning status to success
      await CardQueries.updateProvisioningStatus(provisioningRecord.id, 'success');

      logger.info('Google Pay provisioning completed successfully', { cardId });
      return response;

    } catch (error: any) {
      logger.error('Google Pay provisioning failed', { error: error.message, cardId });

      // Update provisioning status to failed
      const provisioningRecord = await CardQueries.getProvisioningRecord(cardId, 'google_pay');
      if (provisioningRecord) {
        await CardQueries.updateProvisioningStatus(provisioningRecord.id, 'failed', error.message);
      }

      throw error;
    }
  }

  /**
   * Validate Apple Pay certificates
   */
  private async validateApplePayCertificates(certificates: string[]): Promise<void> {
    if (!certificates || certificates.length === 0) {
      throw new Error('No certificates provided for Apple Pay validation');
    }

    // In a real implementation, you would:
    // 1. Parse and validate certificate chain
    // 2. Check certificate validity dates
    // 3. Verify against Apple Pay root certificates
    // 4. Check certificate revocation status

    // For now, basic validation
    for (const cert of certificates) {
      try {
        // Attempt to parse certificate
        const certificate = crypto.createPublicKey(cert);
        if (!certificate) {
          throw new Error('Invalid certificate format');
        }
      } catch (error) {
        throw new Error(`Certificate validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    logger.info('Apple Pay certificates validated successfully');
  }

  /**
   * Generate encrypted payment data for Apple Pay
   */
  private async generateApplePayEncryptedData(
    cardDetails: any,
    request: ApplePayProvisioningRequest
  ): Promise<{
    version: string;
    data: string;
    signature: string;
    header: {
      ephemeralPublicKey: string;
      transactionId: string;
      publicKeyHash: string;
    };
  }> {
    // Generate ephemeral key pair for encryption
    const ephemeralKeyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1'
    });

    // Generate transaction ID
    const transactionId = crypto.randomBytes(16).toString('hex').toUpperCase();

    // Create payment data payload
    const paymentData = {
      applicationPrimaryAccountNumber: cardDetails.card_number,
      applicationExpirationDate: `${cardDetails.expiry_year}${cardDetails.expiry_month}`,
      currencyCode: '840', // USD, adjust as needed
      transactionAmount: 0,
      deviceManufacturerIdentifier: crypto.randomBytes(4).toString('hex').toUpperCase(),
      paymentDataType: '3DSecure',
      paymentData: {
        onlinePaymentCryptogram: crypto.randomBytes(20).toString('base64'),
        eciIndicator: '7'
      }
    };

    // Encrypt payment data (simplified - in production use proper Apple Pay encryption)
    const paymentDataJson = JSON.stringify(paymentData);
    const encryptedData = crypto.publicEncrypt(
      {
        key: ephemeralKeyPair.publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
      },
      Buffer.from(paymentDataJson)
    ).toString('base64');

    // Generate signature (simplified)
    const signatureData = transactionId + encryptedData;
    const signature = crypto.sign('sha256', Buffer.from(signatureData), ephemeralKeyPair.privateKey)
      .toString('base64');

    // Generate public key hash
    const publicKeyHash = crypto.createHash('sha256')
      .update(ephemeralKeyPair.publicKey.export({ type: 'spki', format: 'der' }))
      .digest('hex');

    return {
      version: 'EC_v2',
      data: encryptedData,
      signature: signature,
      header: {
        ephemeralPublicKey: ephemeralKeyPair.publicKey.export({ type: 'spki', format: 'pem' }) as string,
        transactionId: transactionId,
        publicKeyHash: publicKeyHash
      }
    };
  }

  /**
   * Revoke provisioning for a card
   */
  async revokeProvisioning(cardId: string, walletType: 'apple_pay' | 'google_pay'): Promise<void> {
    try {
      logger.info('Revoking wallet provisioning', { cardId, walletType });

      const provisioningRecord = await CardQueries.getProvisioningRecord(cardId, walletType);
      if (!provisioningRecord) {
        throw new Error('Provisioning record not found');
      }

      // In a real implementation, you would:
      // 1. Notify the wallet provider to remove the card
      // 2. Update Weavr if needed
      // 3. Handle any cleanup

      await CardQueries.revokeProvisioning(cardId, walletType);

      logger.info('Wallet provisioning revoked successfully', { cardId, walletType });
    } catch (error: any) {
      logger.error('Failed to revoke provisioning', { error: error.message, cardId, walletType });
      throw error;
    }
  }

  /**
   * Get provisioning status for a card
   */
  async getProvisioningStatus(cardId: string, walletType: 'apple_pay' | 'google_pay'): Promise<CardProvisioning | null> {
    try {
      return await CardQueries.getProvisioningRecord(cardId, walletType);
    } catch (error) {
      logger.error('Failed to get provisioning status', { error: error instanceof Error ? error.message : String(error), cardId, walletType });
      return null;
    }
  }

  /**
   * Get all provisioning records for a card
   */
  async getCardProvisioningHistory(cardId: string): Promise<CardProvisioning[]> {
    try {
      return await CardQueries.getCardProvisioningRecords(cardId);
    } catch (error: any) {
      logger.error('Failed to get provisioning history', { error: error.message, cardId });
      return [];
    }
  }
}

export const pushProvisioningService = new PushProvisioningService(new WeavrService());