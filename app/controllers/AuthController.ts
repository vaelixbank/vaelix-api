import { Request, Response } from 'express';
import { WeavrService } from '../services/weavrService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { parseWeavrError, getWeavrErrorStatus } from '../utils/weavr';
import { LoginRequest, BiometricLoginRequest } from '../models/Auth';

export class AuthController {
  constructor(private weavrService: WeavrService) {}

  async login(req: Request, res: Response) {
    try {
      const { identifier, password }: LoginRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;

      logger.weavrRequest('POST', '/multi/access/login', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/access/login',
        { identifier, password },
        apiKey
      );

      logger.weavrResponse('POST', '/multi/access/login', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/access/login', error, req.headers['x-request-id'] as string);

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

  async loginBiometric(req: Request, res: Response) {
    try {
      const { identifier, biometric_token }: BiometricLoginRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;

      logger.weavrRequest('POST', '/multi/access/login/biometric', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/access/login/biometric',
        { identifier, biometric_token },
        apiKey
      );

      logger.weavrResponse('POST', '/multi/access/login/biometric', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/access/login/biometric', error, req.headers['x-request-id'] as string);

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

  async getUserIdentities(req: Request, res: Response) {
    try {
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', '/multi/access/identities', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        '/multi/access/identities',
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', '/multi/access/identities', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', '/multi/access/identities', error, req.headers['x-request-id'] as string);

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

  async logout(req: Request, res: Response) {
    try {
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', '/multi/access/logout', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/access/logout',
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', '/multi/access/logout', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/access/logout', error, req.headers['x-request-id'] as string);

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

  async requestAccessToken(req: Request, res: Response) {
    try {
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', '/multi/access/token', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/access/token',
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', '/multi/access/token', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/access/token', error, req.headers['x-request-id'] as string);

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