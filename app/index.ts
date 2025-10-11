import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
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
import bulkRoutes from './routes/bulk.Routes';
import { logger } from './utils/logger';

const app = express();

// Trust proxy for reverse proxy (like nginx)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
}));
app.use(cors({
  origin: config.cors.origins,
  credentials: config.cors.credentials,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);

  logger.apiRequest(req.method, req.url, 0, 0, requestId);

  // Log response
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordsRoutes);
app.use('/api/sca', scaRoutes);
app.use('/api/corporates', corporatesRoutes);
app.use('/api/consumers', consumersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/linked-accounts', linkedAccountsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/bulk', bulkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  logger.error('Unhandled error', { error: err.message, stack: err.stack }, requestId);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  const requestId = req.headers['x-request-id'] as string;
  logger.warn('Route not found', { url: req.originalUrl, method: req.method }, requestId);

  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Vaelix Bank API server running on port ${config.port}`, { environment: config.nodeEnv });
});

export default app;