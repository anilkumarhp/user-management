import { Router } from 'express';
import * as organizationController from '@/api/v1/controllers/organization.controller';
import validateRequest from '@/api/v1/middlewares/validation.middleware';
import { organizationRegistrationSchema } from '@/api/v1/validators/organization.validator';
// Public registration, no specific auth middleware here yet

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Organizations
 *     description: Organization registration and management
 */

/**
 * @openapi
 * /organizations/register:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Register a new organization
 *     description: Allows any user to submit an organization for registration. The registration will be pending admin verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrganizationRegistrationInput'
 *     responses:
 *       '201':
 *         description: Organization registration submitted successfully.
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
 *                   example: Organization registration submitted successfully. Pending verification.
 *                 data:
 *                   $ref: '#/components/schemas/OrganizationResponse'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '409':
 *         description: Conflict - Organization with this contact email already exists or is pending verification.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.post(
  '/register',
  validateRequest(organizationRegistrationSchema, 'body'),
  organizationController.registerOrganization
);

export default router;