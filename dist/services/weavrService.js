"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weavrService = exports.WeavrService = void 0;
const axios_1 = __importDefault(require("axios"));
class WeavrService {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: process.env.WEAVR_API_BASE_URL || 'https://api.weavr.io',
            timeout: 30000,
        });
    }
    async makeRequest(method, url, data, apiKey, authToken) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (apiKey) {
            headers['api_key'] = apiKey;
        }
        if (authToken) {
            headers['auth_token'] = authToken;
        }
        try {
            const response = await this.client.request({
                method,
                url,
                data,
                headers,
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                throw new Error(`Weavr API error: ${error.response.status} - ${error.response.data?.message || error.response.data}`);
            }
            throw error;
        }
    }
}
exports.WeavrService = WeavrService;
exports.weavrService = new WeavrService();
