"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeWeavrResponse = exports.getWeavrErrorStatus = exports.isWeavrError = exports.parseWeavrError = void 0;
const axios_1 = __importDefault(require("axios"));
const parseWeavrError = (error) => {
    if (error.response) {
        const { status, data } = error.response;
        // Handle different error response formats from Weavr
        if (typeof data === 'string') {
            return {
                message: data,
                code: `WEAVR_${status}`,
            };
        }
        if (data && typeof data === 'object') {
            const dataObj = data;
            return {
                message: dataObj.message || dataObj.error || `Weavr API error (${status})`,
                code: dataObj.code || `WEAVR_${status}`,
                details: data,
            };
        }
    }
    if (error.request) {
        return {
            message: 'No response received from Weavr API',
            code: 'WEAVR_NO_RESPONSE',
            details: error.message,
        };
    }
    return {
        message: error.message || 'Unknown Weavr API error',
        code: 'WEAVR_UNKNOWN_ERROR',
    };
};
exports.parseWeavrError = parseWeavrError;
const isWeavrError = (error) => {
    return axios_1.default.isAxiosError(error);
};
exports.isWeavrError = isWeavrError;
const getWeavrErrorStatus = (error) => {
    // Map Weavr error codes to HTTP status codes
    const statusMap = {
        'WEAVR_400': 400,
        'WEAVR_401': 401,
        'WEAVR_403': 403,
        'WEAVR_404': 404,
        'WEAVR_409': 409,
        'WEAVR_422': 422,
        'WEAVR_429': 429,
        'WEAVR_500': 500,
        'WEAVR_502': 502,
        'WEAVR_503': 503,
        'WEAVR_504': 504,
    };
    return statusMap[error.code] || 500;
};
exports.getWeavrErrorStatus = getWeavrErrorStatus;
const sanitizeWeavrResponse = (data) => {
    // Remove sensitive information from Weavr responses if needed
    // For now, return as-is since Weavr handles data sanitization
    return data;
};
exports.sanitizeWeavrResponse = sanitizeWeavrResponse;
