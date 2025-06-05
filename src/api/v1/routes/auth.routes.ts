import { Router } from 'express';
import * as authController from '@/api/v1/controllers/auth.controller';
import validateRequest from '@/api/v1/middlewares/validation.middleware';
import { registerUserSchema, loginUserSchema, refreshTokenSchema } from '@/api/v1/validators/auth.validator';
import { authenticateToken, authorizeRoles } from '@/api/v1/middlewares/auth.middleware';
import { UserRoles } from '@/constants/roles.constants';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account with email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationInput'
 *     responses:
 *       '201':
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User registered successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       '400':
 *         description: Validation error or user already exists.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/register', validateRequest(registerUserSchema, 'body'), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log in an existing user
 *     description: Authenticates a user and returns JWT access and refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginInput'
 *     responses:
 *       '200':
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/UserMinimum'
 *       '400':
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       '401':
 *         description: Invalid credentials or account not active.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/login', validateRequest(loginUserSchema, 'body'), authController.login);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh an access token
 *     description: Uses a valid refresh token to obtain a new access token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenInput'
 *     responses:
 *       '200':
 *         description: Access token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Access token refreshed successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       '400':
 *         description: Refresh token is required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Invalid or expired refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/refresh-token', validateRequest(refreshTokenSchema, 'body'), authController.refreshToken);

// /**
//  * @openapi
//  * /auth/me:
//  *   get:
//  *     tags:
//  *       - Authentication
//  *     summary: Get current authenticated user's profile
//  *     description: Fetches the profile information of the currently logged-in user.
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       '200':
//  *         description: Profile fetched successfully.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 status:
//  *                   type: string
//  *                   example: success
//  *                 message:
//  *                   type: string
//  *                   example: Profile fetched successfully.
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     user:
//  *                       $ref: '#/components/schemas/AuthenticatedUserResponse'
//  *       '401':
//  *         description: Unauthorized - Access token is missing, invalid, or expired.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       '404':
//  *         description: User profile not found.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       '500':
//  *         description: Internal server error.
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  */

router.get('/me', authenticateToken, authController.getMyProfile);

/**
 * @openapi
 * /auth/admin-only:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Access an admin-only protected route
 *     description: Example of a route that requires SYSTEM_ADMIN or HOSPITAL_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Access granted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome Admin user@example.com! This is an admin-only area.
 *       '401':
 *         description: Unauthorized - Access token is missing, invalid, or expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden - User does not have the required admin role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.get('/admin-only', authenticateToken, authorizeRoles([UserRoles.SYSTEM_ADMIN, UserRoles.HOSPITAL_ADMIN]), (req, res) => {
    // The req.user type should now be correctly inferred due to global augmentation
    res.json({ message: `Welcome Admin ${req.user?.email}! This is an admin-only area.`});
});

export default router;
