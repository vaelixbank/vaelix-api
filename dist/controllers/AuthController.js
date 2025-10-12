"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const weavr_1 = require("../utils/weavr");
class AuthController {
    constructor(weavrService) {
        this.weavrService = weavrService;
    }
    async login(req, res) {
        try {
            const { identifier, password } = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            logger_1.logger.weavrRequest('POST', '/multi/access/login', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', '/multi/access/login', { identifier, password }, apiKey);
            logger_1.logger.weavrResponse('POST', '/multi/access/login', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', '/multi/access/login', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async loginBiometric(req, res) {
        try {
            const { identifier, biometric_token } = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            logger_1.logger.weavrRequest('POST', '/multi/access/login/biometric', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', '/multi/access/login/biometric', { identifier, biometric_token }, apiKey);
            logger_1.logger.weavrResponse('POST', '/multi/access/login/biometric', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', '/multi/access/login/biometric', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getUserIdentities(req, res) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', '/multi/access/identities', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', '/multi/access/identities', undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', '/multi/access/identities', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', '/multi/access/identities', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async logout(req, res) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', '/multi/access/logout', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', '/multi/access/logout', req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', '/multi/access/logout', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', '/multi/access/logout', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async requestAccessToken(req, res) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', '/multi/access/token', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', '/multi/access/token', req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', '/multi/access/token', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', '/multi/access/token', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
}
exports.AuthController = AuthController;
