"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
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
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Trust proxy for reverse proxy (like nginx)
app.set('trust proxy', 1);
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP for API
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://api.vaelixbank.com', 'https://vaelixbank.com']
        : true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Start server
app.listen(PORT, () => {
    console.log(`Vaelix Bank API server running on port ${PORT}`);
});
exports.default = app;
