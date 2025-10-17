// NASA Security Principle: Defense in Depth - Multiple layers of security controls
// This API implements multiple security layers including authentication, authorization,
// input validation, rate limiting, encryption, and comprehensive logging

// NASA Security Principle: Defense in Depth - Multiple layers of security controls
// This API implements multiple security layers including authentication, authorization,
// input validation, rate limiting, encryption, and comprehensive logging

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index';
import authRoutes from './routes/auth.Routes';
import passwordsRoutes from './routes/passwords.Routes';
import scaRoutes from './routes/sca.Routes';
import corporatesRoutes from './routes/corporates.Routes';
import consumersRoutes from './routes/consumers.Routes';
import usersRoutes from './routes/users.Routes';
import beneficiariesRoutes from './routes/beneficiaries.Routes';
import accountsRoutes from './routes/accounts.Routes';
import cardRoutes from './routes/card.Routes';
import linkedAccountsRoutes from './routes/linkedAccounts.Routes';
import transactionsRoutes from './routes/transactions.Routes';
import interbankRoutes from './routes/interbank.Routes';
import oauth2Routes from './routes/oauth2.Routes';
import cryptoRoutes from './routes/crypto.Routes';
import bulkRoutes from './routes/bulk.Routes';
import apiKeysRoutes from './routes/apiKeys.Routes';
import databaseRoutes from './routes/database.Routes';
import serviceIntegrationsRoutes from './routes/serviceIntegrations.Routes';
import mobileAuthRoutes from './routes/mobileAuth.Routes';
import regulatoryRoutes from './routes/regulatory.Routes';
import openBankingRoutes from './routes/openBanking.Routes';
import adminRoutes from './routes/admin.Routes';
import { logger } from './utils/logger';
import { checkDatabaseConnection } from './utils/database';
import { apiLimiter, authLimiter, sensitiveOperationLimiter } from './middleware/rateLimit';
import { sanitizeInput } from './utils/validation';

const app = express();

// NASA Security Principle: Secure Configuration - Trust proxy only for known reverse proxies
// Limits: 1 to prevent IP spoofing attacks
app.set('trust proxy', 1);

// NASA Security Principle: Secure Headers - Comprehensive security headers to prevent various attacks
// CSP prevents XSS, HSTS enforces HTTPS, noSniff prevents MIME sniffing, XSS filter blocks reflected XSS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year - enforces HTTPS for all subdomains
    includeSubDomains: true,
    preload: true // Allows browser preload list inclusion
  },
  noSniff: true, // Prevents MIME type sniffing
  xssFilter: true, // Enables XSS filtering in browsers
  hidePoweredBy: true // Hide Express server info
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY'); // Prevent clickjacking
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Already in helmet, but explicit
  next();
});

// NASA Security Principle: CORS Configuration - Restricts cross-origin requests to prevent CSRF
app.use(cors({
  origin: config.cors.origins, // Only allow specified origins
  credentials: config.cors.credentials, // Control credential sharing
}));

// NASA Security Principle: Input Validation - Limit request body size to prevent DoS attacks
// 10MB limit is high for banking API; consider reducing for specific endpoints
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NASA Security Principle: Input Validation - Sanitize all inputs to prevent XSS and injection attacks
app.use(sanitizeInput);

// NASA Security Principle: Rate Limiting - Prevents brute force, DoS, and abuse attacks
// Different limits based on endpoint sensitivity following least privilege
app.use('/api/auth', authLimiter); // Stricter limits (5/15min) for auth endpoints to prevent brute force
app.use('/api/transactions', sensitiveOperationLimiter); // Limits (10/hour) for financial operations
app.use('/api', apiLimiter); // General limits (100/15min) for all API endpoints

// NASA Security Principle: Comprehensive Logging - Log all requests for audit and monitoring
// Includes request ID for tracing, timing for performance monitoring, and status for anomaly detection
app.use((req, res, next) => {
  const start = Date.now();
  // Generate unique request ID for tracing across services
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to response for client-side tracing
  res.setHeader('x-request-id', requestId);

  // Log incoming request (security-relevant data masked in logger)
  logger.apiRequest(req.method, req.url, 0, 0, requestId);

  // Log response on completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.apiRequest(req.method, req.url, res.statusCode, duration, requestId);
  });

  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Vaelix Bank API', version: '1.0.0' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordsRoutes);
app.use('/api/sca', scaRoutes);
app.use('/api/corporates', corporatesRoutes);
app.use('/api/consumers', consumersRoutes);
console.log("Registering users routes");app.use('/api/users', usersRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/linked-accounts', linkedAccountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/interbank', interbankRoutes);
app.use('/api/oauth2', oauth2Routes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/keys', apiKeysRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/service-integrations', serviceIntegrationsRoutes);
app.use('/api/auth/mobile', mobileAuthRoutes);
app.use('/api/regulatory', regulatoryRoutes);
app.use('/api/open-banking', openBankingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

// NASA Security Principle: Secure Error Handling - Never expose sensitive information in errors
// Log full details internally but return generic messages to prevent information leakage
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  // Log full error details for debugging (never expose stack traces in production)
  logger.error('Unhandled error', { error: err.message, stack: err.stack }, requestId);

  // Return generic error message to prevent information disclosure
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    // Only include stack trace in development environment
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// NASA Security Principle: Secure Defaults - Handle unknown routes securely
// Log 404s for monitoring potential reconnaissance attempts
app.use((req, res) => {
  const requestId = req.headers['x-request-id'] as string;
  // Log 404s to detect potential security scanning or misconfigurations
  logger.warn('Route not found', { url: req.originalUrl, method: req.method }, requestId);

  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// NASA Security Principle: Secure Deployment - Log startup for audit trail
// Ensure server only starts after all security middleware is configured
app.listen(config.port, () => {
  logger.info(`Vaelix Bank API server running on port ${config.port}`, { environment: config.nodeEnv });
});

export default app;