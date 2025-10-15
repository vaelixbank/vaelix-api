import { Router } from 'express';
import { oauth2Controller } from '../controllers/oauth2Controller';

const router = Router();

// OAuth 2.0 Authorization Endpoint (RFC 6749)
router.get('/authorize', oauth2Controller.authorize.bind(oauth2Controller));

// OAuth 2.0 Token Endpoint
router.post('/token', oauth2Controller.token.bind(oauth2Controller));

// MFA Setup
router.post('/mfa/setup', oauth2Controller.setupMFA.bind(oauth2Controller));

// MFA Verification
router.post('/mfa/verify', oauth2Controller.verifyMFA.bind(oauth2Controller));

// Token Validation
router.post('/token/validate', oauth2Controller.validateToken.bind(oauth2Controller));

export default router;