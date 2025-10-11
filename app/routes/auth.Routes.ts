import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { WeavrService } from '../services/weavrService';
import { validateRequiredFields } from '../utils/validation';

const router = Router();
const weavrService = new WeavrService();
const authController = new AuthController(weavrService);

// Login with password
router.post('/login', validateRequiredFields(['identifier', 'password']), (req, res) =>
  authController.login(req, res)
);

// Login via biometrics
router.post('/login/biometric', validateRequiredFields(['identifier', 'biometric_token']), (req, res) =>
  authController.loginBiometric(req, res)
);

// Get user identities
router.get('/identities', (req, res) =>
  authController.getUserIdentities(req, res)
);

// Logout
router.post('/logout', (req, res) =>
  authController.logout(req, res)
);

// Acquire a new access token
router.post('/token', (req, res) =>
  authController.requestAccessToken(req, res)
);

export default router;