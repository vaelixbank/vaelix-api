"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const weavrService_1 = require("../services/weavrService");
const axios_1 = __importDefault(require("axios"));
// Mock axios
jest.mock('axios');
const mockedAxios = axios_1.default;
describe('WeavrService', () => {
    let weavrService;
    beforeEach(() => {
        weavrService = new weavrService_1.WeavrService();
        jest.clearAllMocks();
    });
    describe('makeRequest', () => {
        it('should make a successful GET request', async () => {
            const mockResponse = { data: { success: true } };
            mockedAxios.create.mockReturnValue({
                request: jest.fn().mockResolvedValue(mockResponse),
            });
            const result = await weavrService.makeRequest('GET', '/test', undefined, 'api-key', 'auth-token');
            expect(result).toEqual({ success: true });
        });
        it('should handle Weavr API errors', async () => {
            const mockError = {
                response: {
                    status: 400,
                    data: { message: 'Bad Request', code: 'INVALID_REQUEST' },
                },
            };
            mockedAxios.create.mockReturnValue({
                request: jest.fn().mockRejectedValue(mockError),
            });
            await expect(weavrService.makeRequest('POST', '/test', { data: 'test' }, 'api-key', 'auth-token')).rejects.toThrow('Weavr API error: 400 - Bad Request');
        });
        it('should handle network errors', async () => {
            const mockError = {
                request: {},
                message: 'Network Error',
            };
            mockedAxios.create.mockReturnValue({
                request: jest.fn().mockRejectedValue(mockError),
            });
            await expect(weavrService.makeRequest('GET', '/test', undefined, 'api-key', 'auth-token')).rejects.toThrow('No response received from Weavr API');
        });
    });
});
