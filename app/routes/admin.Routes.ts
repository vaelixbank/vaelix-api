import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Admin authentication routes
router.post('/auth/login', authLimiter, AdminController.login);
router.get('/auth/me', AdminController.getCurrentUser);

// Admin dashboard routes
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Admin data routes
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.get('/accounts', AdminController.getAccounts);
router.get('/transactions', AdminController.getTransactions);
router.get('/api-keys', AdminController.getApiKeys);
router.get('/compliance/aml-flags', AdminController.getAmlFlags);
router.get('/monitoring/metrics', AdminController.getApiMetrics);

export default router;