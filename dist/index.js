"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./config"));
const auth_Routes_1 = __importDefault(require("./routes/auth.Routes"));
const passwords_Routes_1 = __importDefault(require("./routes/passwords.Routes"));
const sca_Routes_1 = __importDefault(require("./routes/sca.Routes"));
const corporates_Routes_1 = __importDefault(require("./routes/corporates.Routes"));
const consumers_Routes_1 = __importDefault(require("./routes/consumers.Routes"));
const users_Routes_1 = __importDefault(require("./routes/users.Routes"));
const beneficiaries_Routes_1 = __importDefault(require("./routes/beneficiaries.Routes"));
const accounts_Routes_1 = __importDefault(require("./routes/accounts.Routes"));
const card_Routes_1 = __importDefault(require("./routes/card.Routes"));
const linkedAccounts_Routes_1 = __importDefault(require("./routes/linkedAccounts.Routes"));
const transactions_Routes_1 = __importDefault(require("./routes/transactions.Routes"));
const bulk_Routes_1 = __importDefault(require("./routes/bulk.Routes"));
const apiKeys_Routes_1 = __importDefault(require("./routes/apiKeys.Routes"));
const mobileAuth_Routes_1 = __importDefault(require("./routes/mobileAuth.Routes"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
// Trust proxy for reverse proxy (like nginx)
app.set('trust proxy', 1);
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP for API
}));
app.use((0, cors_1.default)({
    origin: config_1.default.cors.origins,
    credentials: config_1.default.cors.credentials,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);
    logger_1.logger.apiRequest(req.method, req.url, 0, 0, requestId);
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.apiRequest(req.method, req.url, res.statusCode, duration, requestId);
    });
    next();
});
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Vaelix Bank API', version: '1.0.0' });
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api/auth', auth_Routes_1.default);
app.use('/api/passwords', passwords_Routes_1.default);
app.use('/api/sca', sca_Routes_1.default);
app.use('/api/corporates', corporates_Routes_1.default);
app.use('/api/consumers', consumers_Routes_1.default);
app.use('/api/users', users_Routes_1.default);
app.use('/api/beneficiaries', beneficiaries_Routes_1.default);
app.use('/api/accounts', accounts_Routes_1.default);
app.use('/api/cards', card_Routes_1.default);
app.use('/api/linked-accounts', linkedAccounts_Routes_1.default);
app.use('/api/transactions', transactions_Routes_1.default);
app.use('/api/bulk', bulk_Routes_1.default);
app.use('/api/keys', apiKeys_Routes_1.default);
app.use('/api/auth/mobile', mobileAuth_Routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config_1.default.nodeEnv
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.error('Unhandled error', { error: err.message, stack: err.stack }, requestId);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(config_1.default.nodeEnv === 'development' && { stack: err.stack })
    });
});
// 404 handler
app.use('*', (req, res) => {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.warn('Route not found', { url: req.originalUrl, method: req.method }, requestId);
    res.status(404).json({
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND'
    });
});
// Start server
app.listen(config_1.default.port, () => {
    logger_1.logger.info(`Vaelix Bank API server running on port ${config_1.default.port}`, { environment: config_1.default.nodeEnv });
});
exports.default = app;
