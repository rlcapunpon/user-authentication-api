/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and authorization
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       201: # Created
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *       400:
 *         description: Bad request, e.g., user already exists or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user and get JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Unauthorized, invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Unauthorized, invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user and revoke refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: User logged out successfully (No Content)
 *       400:
 *         description: Bad request, e.g., invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 isActive:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *       400:
 *         description: Bad request, e.g., invalid input or old password mismatch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized, no token or invalid token
 */

/**
 * @swagger
 * /auth/me:
 *   delete:
 *     summary: Deactivate current user's account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deactivated successfully (No Content)
 *       401:
 *         description: Unauthorized, no token or invalid token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /auth/validate:
 *   post:
 *     summary: Validate an access token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 decoded:
 *                   type: object
 *                   nullable: true
 *                 error:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Bad request, e.g., missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /auth/verify/{verificationCode}:
 *   post:
 *     summary: Verify user email using verification code
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: verificationCode
 *         required: true
 *         schema:
 *           type: string
 *         description: The email verification code sent to the user
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email verified successfully"
 *       400:
 *         description: Bad request, e.g., invalid, expired, or already used verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     invalid: "Invalid verification code"
 *                     expired: "Verification code has expired"
 *                     used: "Verification code has already been used"
 */

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email address to resend verification for
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Verification email sent successfully"
 *       400:
 *         description: Bad request, e.g., user not found, already verified, or invalid email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     notFound: "User not found"
 *                     verified: "Email is already verified"
 *                     invalidEmail: "Invalid email format"
 */

import { Router } from 'express';
import { register, login, refresh, logout, getMe, validate as validateToken, updateMe, deactivateMyAccount, verifyEmail, resendVerification } from '../controllers';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema, resendVerificationSchema } from '../schemas/auth.schema';
import { updateMyProfileSchema } from '../schemas/user.schema';
import { authGuard } from '../middleware/auth.middleware';

const router = Router();

// Add logging middleware for all auth routes
router.use((req, res, next) => {
  console.log(`[AUTH ROUTE] ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.method === 'POST' ? (req.body || {}) : undefined,
    timestamp: new Date().toISOString(),
  });
  next();
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', validate(refreshTokenSchema), logout);
router.get('/me', authGuard, getMe);
router.put('/me', authGuard, validate(updateMyProfileSchema), updateMe);
router.delete('/me', authGuard, deactivateMyAccount);
router.post('/validate', authGuard, validateToken);

// Add specific logging for email verification route
router.post('/verify/:verificationCode', (req, res, next) => {
  console.log('[EMAIL VERIFICATION ROUTE MATCHED]', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    verificationCode: req.params.verificationCode,
    verificationCodeLength: req.params.verificationCode?.length || 0,
    timestamp: new Date().toISOString(),
  });
  next();
}, verifyEmail);

router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

// Add debug routes to test routing patterns
router.get('/debug/routes', (req, res) => {
  console.log('[DEBUG] Route listing endpoint called');
  const routes = [
    'GET /auth/debug/routes',
    'POST /auth/register',
    'POST /auth/login', 
    'POST /auth/refresh',
    'POST /auth/logout',
    'GET /auth/me',
    'PUT /auth/me',
    'DELETE /auth/me',
    'POST /auth/validate',
    'POST /auth/verify/:verificationCode',
    'POST /auth/resend-verification',
  ];
  res.json({ message: 'Auth routes debug', routes });
});

// Add a test endpoint for verify route
router.get('/verify/test', (req, res) => {
  console.log('[DEBUG] Verify test endpoint called');
  res.json({ 
    message: 'Email verification route is working',
    endpoint: 'POST /api/auth/verify/:verificationCode',
    example: 'POST /api/auth/verify/1234567890abcdef1234567890abcdef',
    format: '32-character hexadecimal string (0-9, a-f)',
    timestamp: new Date().toISOString(),
  });
});

// Debug route removed to avoid conflicts

export default router;