// src/routes/auth.routes.ts
import express from 'express';
import * as authController from '@/api/v1/controllers/auth.controller';
import  validateRequest from '@/api/v1/middlewares/validation.middleware'; // Assuming you have this
import { forgotPasswordSchema, resetPasswordSchema } from '@/api/v1/validators/auth.validator'
// import { registerUserSchema } from '@/validations/user.validation'; // If register is here

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Authentication
 *     description: User authentication, registration, and password management
 */

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request a password reset
 *     description: Initiates the password reset process by sending a reset link to the user's email if the email is registered and the account is active.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       '200':
 *         description: Password reset instructions sent (if email exists and account is active).
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
 *                   example: If your email address is registered, you will receive a password reset link shortly.
 *       '400':
 *         description: Validation error (e.g., invalid email format).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/forgot-password', validateRequest(forgotPasswordSchema, 'body'), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset user password
 *     description: Resets the user's password using a valid reset token and a new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       '200':
 *         description: Password reset successfully.
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
 *                   example: Password has been reset successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       '400':
 *         description: Validation error (e.g., weak password, passwords don't match) or invalid/expired/used token.
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
router.post('/reset-password', validateRequest(resetPasswordSchema, 'body'), authController.resetPassword);

export default router;