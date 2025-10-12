"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeavrAccountController = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const weavr_1 = require("../utils/weavr");
class WeavrAccountController {
    constructor(weavrService) {
        this.weavrService = weavrService;
    }
    async getAllAccounts(req, res) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', '/multi/managed_accounts', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', '/multi/managed_accounts', undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', '/multi/managed_accounts', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', '/multi/managed_accounts', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async createAccount(req, res) {
        try {
            const accountData = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', '/multi/managed_accounts', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', '/multi/managed_accounts', accountData, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', '/multi/managed_accounts', 201, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.created(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', '/multi/managed_accounts', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getAccount(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', `/multi/managed_accounts/${req.params.id}`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', `/multi/managed_accounts/${req.params.id}`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async updateAccount(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('PATCH', `/multi/managed_accounts/${req.params.id}`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('PATCH', `/multi/managed_accounts/${req.params.id}`, updateData, apiKey, authToken);
            logger_1.logger.weavrResponse('PATCH', `/multi/managed_accounts/${req.params.id}`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('PATCH', `/multi/managed_accounts/${req.params.id}`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async blockAccount(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/block`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/block`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/block`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/block`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async unblockAccount(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/unblock`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/unblock`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/unblock`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getAccountStatement(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}/statement`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', `/multi/managed_accounts/${req.params.id}/statement`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}/statement`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async upgradeAccountWithIBAN(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/iban`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/iban`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/iban`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getAccountIBAN(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}/iban`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', `/multi/managed_accounts/${req.params.id}/iban`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}/iban`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async removeAccount(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/remove`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_accounts/${req.params.id}/remove`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/remove`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
}
exports.WeavrAccountController = WeavrAccountController;
