// File: src/api/v1/routes/labAdmin.routes.ts
import { Router } from 'express';
import * as labAdminController from '@/api/v1/controllers/labAdmin.controller';
import { authenticateToken, authorizeRoles } from '@/api/v1/middlewares/auth.middleware';
import validateRequest from '@/api/v1/middlewares/validation.middleware';
import { 
    createLabStaffSchema, 
    listLabStaffQuerySchema, 
    updateLabStaffStatusSchema 
} from '@/api/v1/validators/labAdmin.validator';
import { UserRoles } from '@/constants/roles.constants';
import logger from '@/utils/logger.utils';

const router = Router();

router.use((req, res, next) => {
    logger.debug(`LAB ADMIN ROUTER: Path - ${req.path}, OriginalURL - ${req.originalUrl}, BaseURL - ${req.baseUrl}`);
    next();
});

router.use(authenticateToken, authorizeRoles([UserRoles.LAB_ADMIN]));

/**
 * @openapi
 * tags:
 *   - name: Organizations
 *     description: Organization registration and management
 */

/**
 * @openapi
 * /lab-admin/staff:
 *   post:
 *     tags:
 *       - Lab Admin - Staff Management
 *     summary: Create a new lab staff member
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStaffInput'
 *     responses:
 *       '201':
 *         description: Lab staff member created successfully.
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
 *                   example: Lab staff member created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/StaffUserResponse'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '409':
 *         description: Conflict - User with this email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.post('/staff', validateRequest(createLabStaffSchema, 'body'), labAdminController.createLabStaff);

/**
 * @openapi
 * /lab-admin/staff:
 *   get:
 *     tags:
 *       - Lab Admin - Staff Management
 *     summary: List staff members of the lab
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageQueryParam'
 *       - $ref: '#/components/parameters/LimitQueryParam'
 *     responses:
 *       '200':
 *         description: A list of lab staff members.
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
 *                   example: Lab staff members fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StaffUserResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.get('/staff', validateRequest(listLabStaffQuerySchema, 'query'), labAdminController.listLabStaff);

/**
 * @openapi
 * /lab-admin/staff/{staffUserId}:
 *   get:
 *     tags:
 *       - Lab Admin - Staff Management
 *     summary: Get details of a specific lab staff member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: staffUserId
 *         in: path
 *         required: true
 *         description: ID of the staff member to retrieve.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Lab staff member details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/StaffUserResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.get('/staff/:staffUserId', labAdminController.getLabStaffMember);

/**
 * @openapi
 * /lab-admin/staff/{staffUserId}/status:
 *   patch:
 *     tags:
 *       - Lab Admin - Staff Management
 *     summary: Update lab staff member's account status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: staffUserId
 *         in: path
 *         required: true
 *         description: ID of the staff member to update.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateUserStatusDto'
 *     responses:
 *       '200':
 *         description: Lab staff member status updated successfully.
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
 *                   example: Lab staff member status updated.
 *                 data:
 *                   $ref: '#/components/schemas/StaffUserResponse'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.patch('/staff/:staffUserId/status', validateRequest(updateLabStaffStatusSchema, 'body'), labAdminController.updateLabStaffStatus);

export default router;