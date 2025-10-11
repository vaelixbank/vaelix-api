import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for reverse proxy (like nginx)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://api.vaelixbank.com', 'https://vaelixbank.com']
    : true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app;