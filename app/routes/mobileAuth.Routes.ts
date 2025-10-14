import { Router } from 'express';
import { MobileAuthController } from '../controllers/MobileAuthController';
import { authenticateMobileUser, optionalMobileAuth, requireVerifiedUser, validateDeviceId } from '../middleware/mobileAuth';
import { validateRequiredFields, validatePassword } from '../utils/validation';
import { validateSession } from '../middleware/sessionSecurity';

const router = Router();

// Public routes (no authentication required)
router.post('/register', validateDeviceId, validateRequiredFields(['email', 'phone', 'full_name', 'password']), validatePassword, MobileAuthController.register);
router.post('/login', validateDeviceId, validateRequiredFields(['email', 'device_id']), MobileAuthController.login);
router.post('/refresh', validateRequiredFields(['refresh_token']), MobileAuthController.refreshToken);
router.post('/password-reset', validateRequiredFields(['email']), MobileAuthController.passwordResetRequest);
router.post('/password-reset/confirm', validateRequiredFields(['token', 'new_password']), validatePassword, MobileAuthController.passwordResetConfirm);

// Protected routes (authentication required)
router.use(validateSession);

router.post('/logout', MobileAuthController.logout);
router.post('/verify/send', validateRequiredFields(['type']), MobileAuthController.sendVerification);
router.post('/verify', validateRequiredFields(['code', 'type']), MobileAuthController.verifyCode);
router.get('/profile', MobileAuthController.getProfile);

// Routes requiring verified account
router.use(requireVerifiedUser);

// Add verified-only routes here
// router.get('/accounts', ...);
// router.post('/transfer', ...);

export default router;