import { Request, Response } from 'express';
import { WeavrService } from '../services/weavrService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { parseWeavrError, getWeavrErrorStatus } from '../utils/weavr';
import { CreateManagedCardRequest, UpdateManagedCardRequest, CreateSpendRulesRequest } from '../models/Card';

export class CardController {
  constructor(private weavrService: WeavrService) {}

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
}