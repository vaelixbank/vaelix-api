import { Request, Response } from 'express';
import { WeavrService } from '../services/weavrService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { parseWeavrError, getWeavrErrorStatus } from '../utils/weavr';
import { CreateManagedAccountRequest, UpdateManagedAccountRequest } from '../models/Account';

export class WeavrAccountController {
  constructor(private weavrService: WeavrService) {}

  async getAllAccounts(req: Request, res: Response) {
    try {
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', '/multi/managed_accounts', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        '/multi/managed_accounts',
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', '/multi/managed_accounts', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', '/multi/managed_accounts', error, req.headers['x-request-id'] as string);

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

  async createAccount(req: Request, res: Response) {
    try {
      const accountData: CreateManagedAccountRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', '/multi/managed_accounts', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/managed_accounts',
        accountData,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', '/multi/managed_accounts', 201, req.headers['x-request-id'] as string);

      return ApiResponseHandler.created(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/managed_accounts', error, req.headers['x-request-id'] as string);

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

  async getAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${req.params.id}`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', `/multi/managed_accounts/${req.params.id}`, error, req.headers['x-request-id'] as string);

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

  async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateManagedAccountRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('PATCH', `/multi/managed_accounts/${req.params.id}`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'PATCH',
        `/multi/managed_accounts/${req.params.id}`,
        updateData,
        apiKey,
        authToken
      );

      logger.weavrResponse('PATCH', `/multi/managed_accounts/${req.params.id}`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('PATCH', `/multi/managed_accounts/${req.params.id}`, error, req.headers['x-request-id'] as string);

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

  async blockAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/block`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/block`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/block`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/block`, error, req.headers['x-request-id'] as string);

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

  async unblockAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/unblock`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/unblock`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/unblock`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

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

  async getAccountStatement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}/statement`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${req.params.id}/statement`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}/statement`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

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

  async upgradeAccountWithIBAN(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/iban`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/iban`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/iban`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

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

  async getAccountIBAN(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}/iban`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${req.params.id}/iban`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}/iban`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

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

  async removeAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/remove`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/remove`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/remove`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

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