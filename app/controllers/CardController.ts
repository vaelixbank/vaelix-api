import { Request, Response } from 'express';
import { WeavrService } from '../services/weavrService';
import { PushProvisioningService } from '../services/pushProvisioningService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { parseWeavrError, getWeavrErrorStatus } from '../utils/weavr';
import { CreateManagedCardRequest, UpdateManagedCardRequest, CreateSpendRulesRequest, ApplePayProvisioningRequest, GooglePayProvisioningRequest } from '../models/Card';
import { CardQueries } from '../queries/cardQueries';
import { AuthQueries } from '../queries/authQueries';
import { UserQueries } from '../queries/userQueries';

export class CardController {
  constructor(
    private weavrService: WeavrService,
    private pushProvisioningService: PushProvisioningService
  ) {}

  async getAllCards(req: Request, res: Response) {
    try {
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', '/multi/managed_cards', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        '/multi/managed_cards',
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', '/multi/managed_cards', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', '/multi/managed_cards', error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async createCard(req: Request, res: Response) {
    try {
      const cardData: CreateManagedCardRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', '/multi/managed_cards', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/managed_cards',
        cardData,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', '/multi/managed_cards', 201, req.headers['x-request-id'] as string);

      // Log card creation in local database
      try {
        // TODO: Extract user ID from auth token or request context
        const userId = 1; // Placeholder - implement proper user extraction from JWT/auth
        if (result.id) {
          await CardQueries.createVibanCard(userId, result.id, result.card_number || '', 'EUR', 'active');
          await AuthQueries.createAuditLog(userId, 'CARD_CREATED', 'card', result.id);
        }
      } catch (dbError) {
        logger.error('Failed to log card creation in database', { error: dbError }, req.headers['x-request-id'] as string);
      }

      return ApiResponseHandler.created(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/managed_cards', error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_cards/${req.params.id}`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_cards/${req.params.id}`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_cards/${req.params.id}`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', `/multi/managed_cards/${req.params.id}`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async updateCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateManagedCardRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('PATCH', `/multi/managed_cards/${req.params.id}`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'PATCH',
        `/multi/managed_cards/${req.params.id}`,
        updateData,
        apiKey,
        authToken
      );

      logger.weavrResponse('PATCH', `/multi/managed_cards/${req.params.id}`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('PATCH', `/multi/managed_cards/${req.params.id}`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async blockCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/block`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_cards/${req.params.id}/block`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/block`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/block`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async unblockCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/unblock`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_cards/${req.params.id}/unblock`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/unblock`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async removeCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/remove`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_cards/${req.params.id}/remove`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/remove`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/remove`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getCardStatement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_cards/${req.params.id}/statement`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_cards/${req.params.id}/statement`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_cards/${req.params.id}/statement`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', `/multi/managed_cards/${req.params.id}/statement`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async assignCard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/assign`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_cards/${req.params.id}/assign`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/assign`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/assign`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getSpendRules(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_cards/${req.params.id}/spend_rules`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async createSpendRules(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rulesData: CreateSpendRulesRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_cards/${req.params.id}/spend_rules`,
        rulesData,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async updateSpendRules(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rulesData: CreateSpendRulesRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'PATCH',
        `/multi/managed_cards/${req.params.id}/spend_rules`,
        rulesData,
        apiKey,
        authToken
      );

      logger.weavrResponse('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async deleteSpendRules(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'DELETE',
        `/multi/managed_cards/${req.params.id}/spend_rules`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getCardWalletDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_cards/${id}/wallet-details`, req.headers['x-request-id'] as string);

      // Get card details from Weavr
      const walletData = await this.weavrService.getCardForWallet(id, apiKey, authToken);

      // Store in local DB for temporary access
      const localCard = await CardQueries.getCardByWeavrId(id);
      if (localCard) {
        await CardQueries.prepareCardForWallet(localCard.id, walletData);
      }

      // Return formatted details (CVV will be cleared after first access)
      const details = await CardQueries.getCardWalletDetails(localCard.id);

      logger.weavrResponse('GET', `/multi/managed_cards/${id}/wallet-details`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, details);
    } catch (error: any) {
      logger.weavrError('GET', `/multi/managed_cards/${req.params.id}/wallet-details`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async checkProvisioningEligibility(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { walletType } = req.query as { walletType: 'apple_pay' | 'google_pay' };

      if (!walletType || !['apple_pay', 'google_pay'].includes(walletType)) {
        return ApiResponseHandler.error(res, 'Invalid wallet type', 'VALIDATION_ERROR', 400);
      }

      const result = await this.pushProvisioningService.checkEligibility(id, walletType);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.error('Provisioning eligibility check failed', { error: error.message, cardId: req.params.id });

      return ApiResponseHandler.error(
        res,
        error.message || 'Eligibility check failed',
        'PROVISIONING_ERROR',
        500
      );
    }
  }

  async provisionForApplePay(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const provisioningRequest: ApplePayProvisioningRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.info('Apple Pay provisioning request', { cardId: id, requestId: req.headers['x-request-id'] });

      const result = await this.pushProvisioningService.provisionForApplePay(
        id,
        provisioningRequest,
        apiKey,
        authToken
      );

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.error('Apple Pay provisioning failed', { error: error.message, cardId: req.params.id });

      return ApiResponseHandler.error(
        res,
        error.message || 'Apple Pay provisioning failed',
        'PROVISIONING_ERROR',
        500
      );
    }
  }

  async provisionForGooglePay(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const provisioningRequest: GooglePayProvisioningRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.info('Google Pay provisioning request', { cardId: id, requestId: req.headers['x-request-id'] });

      const result = await this.pushProvisioningService.provisionForGooglePay(
        id,
        provisioningRequest,
        apiKey,
        authToken
      );

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.error('Google Pay provisioning failed', { error: error.message, cardId: req.params.id });

      return ApiResponseHandler.error(
        res,
        error.message || 'Google Pay provisioning failed',
        'PROVISIONING_ERROR',
        500
      );
    }
  }

  async getProvisioningStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { walletType } = req.query as { walletType: 'apple_pay' | 'google_pay' };

      if (!walletType || !['apple_pay', 'google_pay'].includes(walletType)) {
        return ApiResponseHandler.error(res, 'Invalid wallet type', 'VALIDATION_ERROR', 400);
      }

      const result = await this.pushProvisioningService.getProvisioningStatus(id, walletType);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.error('Get provisioning status failed', { error: error.message, cardId: req.params.id });

      return ApiResponseHandler.error(
        res,
        error.message || 'Failed to get provisioning status',
        'PROVISIONING_ERROR',
        500
      );
    }
  }

  async getProvisioningHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.pushProvisioningService.getCardProvisioningHistory(id);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.error('Get provisioning history failed', { error: error.message, cardId: req.params.id });

      return ApiResponseHandler.error(
        res,
        error.message || 'Failed to get provisioning history',
        'PROVISIONING_ERROR',
        500
      );
    }
  }

  async revokeProvisioning(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { walletType } = req.body as { walletType: 'apple_pay' | 'google_pay' };

      if (!walletType || !['apple_pay', 'google_pay'].includes(walletType)) {
        return ApiResponseHandler.error(res, 'Invalid wallet type', 'VALIDATION_ERROR', 400);
      }

      logger.info('Revoke provisioning request', { cardId: id, walletType, requestId: req.headers['x-request-id'] });

      await this.pushProvisioningService.revokeProvisioning(id, walletType);

      return ApiResponseHandler.success(res, { message: 'Provisioning revoked successfully' });
    } catch (error: any) {
      logger.error('Revoke provisioning failed', { error: error.message, cardId: req.params.id });

      return ApiResponseHandler.error(
        res,
        error.message || 'Failed to revoke provisioning',
        'PROVISIONING_ERROR',
        500
      );
    }
  }
}