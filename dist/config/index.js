"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    weavr: {
        baseUrl: process.env.WEAVR_API_BASE_URL || 'https://api.weavr.io',
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'vaelixbank',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    },
    cors: {
        origins: process.env.NODE_ENV === 'production'
            ? ['https://api.vaelixbank.com', 'https://vaelixbank.com']
            : ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    },
    security: {
        helmet: true,
    },
};
exports.default = config;
