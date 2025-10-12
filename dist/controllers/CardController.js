"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardController = void 0;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
const weavr_1 = require("../utils/weavr");
const cardQueries_1 = require("../queries/cardQueries");
const authQueries_1 = require("../queries/authQueries");
class CardController {
    constructor(weavrService) {
        this.weavrService = weavrService;
    }
    async getAllCards(req, res) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', '/multi/managed_cards', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', '/multi/managed_cards', undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', '/multi/managed_cards', 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', '/multi/managed_cards', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async createCard(req, res) {
        try {
            const cardData = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', '/multi/managed_cards', req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', '/multi/managed_cards', cardData, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', '/multi/managed_cards', 201, req.headers['x-request-id']);
            // Log card creation in local database
            try {
                // TODO: Extract user ID from auth token or request context
                const userId = 1; // Placeholder - implement proper user extraction from JWT/auth
                if (result.id) {
                    await cardQueries_1.CardQueries.createVibanCard(userId, result.id, result.card_number || '', 'EUR', 'active');
                    await authQueries_1.AuthQueries.createAuditLog(userId, 'CARD_CREATED', 'card', result.id);
                }
            }
            catch (dbError) {
                logger_1.logger.error('Failed to log card creation in database', { error: dbError }, req.headers['x-request-id']);
            }
            return response_1.ApiResponseHandler.created(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', '/multi/managed_cards', error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getCard(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', `/multi/managed_cards/${req.params.id}`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', `/multi/managed_cards/${req.params.id}`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', `/multi/managed_cards/${req.params.id}`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async updateCard(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('PATCH', `/multi/managed_cards/${req.params.id}`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('PATCH', `/multi/managed_cards/${req.params.id}`, updateData, apiKey, authToken);
            logger_1.logger.weavrResponse('PATCH', `/multi/managed_cards/${req.params.id}`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('PATCH', `/multi/managed_cards/${req.params.id}`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async blockCard(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/block`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/block`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/block`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/block`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async unblockCard(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/unblock`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/unblock`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/unblock`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/unblock`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async removeCard(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/remove`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/remove`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/remove`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/remove`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getCardStatement(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', `/multi/managed_cards/${req.params.id}/statement`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}/statement`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', `/multi/managed_cards/${req.params.id}/statement`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', `/multi/managed_cards/${req.params.id}/statement`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async assignCard(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/assign`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/assign`, req.body, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/assign`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/assign`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async getSpendRules(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('GET', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async createSpendRules(req, res) {
        try {
            const { id } = req.params;
            const rulesData = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, rulesData, apiKey, authToken);
            logger_1.logger.weavrResponse('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('POST', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async updateSpendRules(req, res) {
        try {
            const { id } = req.params;
            const rulesData = req.body;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, rulesData, apiKey, authToken);
            logger_1.logger.weavrResponse('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('PATCH', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
    async deleteSpendRules(req, res) {
        try {
            const { id } = req.params;
            const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
            const authToken = req.headers['authorization'] || req.headers['auth_token'];
            logger_1.logger.weavrRequest('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, req.headers['x-request-id']);
            const result = await this.weavrService.makeRequest('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, undefined, apiKey, authToken);
            logger_1.logger.weavrResponse('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, 200, req.headers['x-request-id']);
            return response_1.ApiResponseHandler.success(res, result);
        }
        catch (error) {
            logger_1.logger.weavrError('DELETE', `/multi/managed_cards/${req.params.id}/spend_rules`, error, req.headers['x-request-id']);
            const weavrError = (0, weavr_1.parseWeavrError)(error);
            return response_1.ApiResponseHandler.error(res, weavrError.message, weavrError.code, (0, weavr_1.getWeavrErrorStatus)(weavrError), weavrError.details);
        }
    }
}
exports.CardController = CardController;
