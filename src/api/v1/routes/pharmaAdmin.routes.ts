import { Router } from 'express';
import * as pharmaAdminController from '@/api/v1/controllers/pharmaAdmin.controller';
import { authenticateToken, authorizeRoles } from '@/api/v1/middlewares/auth.middleware';
import validateRequest from '@/api/v1/middlewares/validation.middleware';
import { 
    createPharmaStaffSchema, 
    listPharmaStaffQuerySchema, 
    updatePharmaStaffStatusSchema 
} from '@/api/v1/validators/pharmaAdmin.validator';
import { UserRoles } from '@/constants/roles.constants';
import logger from '@/utils/logger.utils';

const router = Router();

router.use((req, res, next) => {
    logger.debug(`PHARMA ADMIN ROUTER: Path - ${req.path}, OriginalURL - ${req.originalUrl}, BaseURL - ${req.baseUrl}`);
    next();
});

router.use(authenticateToken, authorizeRoles([UserRoles.PHARMA_ADMIN]));

/**
 * @openapi
 * tags:
 *   - name: Pharma Admin - Staff Management
 *     description: APIs for Pharmacy Administrators to manage their staff
 */

/**
 * @openapi
 * /pharma-admin/staff:
 *   post:
 *     tags:
 *       - Pharma Admin - Staff Management
 *     summary: Create a new pharmacy staff member
 *     description: Allows a Pharma Admin to create a new staff member for their pharmacy.
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
 *         description: Pharmacy staff member created successfully.
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
 *                   example: Pharmacy staff member created successfully.
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

router.post('/staff', validateRequest(createPharmaStaffSchema, 'body'), pharmaAdminController.createPharmaStaff);

/**
 * @openapi
 * /pharma-admin/staff:
 *   get:
 *     tags:
 *       - Pharma Admin - Staff Management
 *     summary: List staff members of the pharmacy
 *     description: Retrieves a paginated list of staff members associated with the pharma admin's organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageQueryParam'
 *       - $ref: '#/components/parameters/LimitQueryParam'
 *     responses:
 *       '200':
 *         description: A list of pharmacy staff members.
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
 *                   example: Pharmacy staff members fetched successfully.
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

router.get('/staff', validateRequest(listPharmaStaffQuerySchema, 'query'), pharmaAdminController.listPharmaStaff);

/**
 * @openapi
 * /pharma-admin/staff/{staffUserId}:
 *   get:
 *     tags:
 *       - Pharma Admin - Staff Management
 *     summary: Get details of a specific pharmacy staff member
 *     description: Retrieves details for a specific staff member within the pharma admin's organization.
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
 *         description: Pharmacy staff member details.
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

router.get('/staff/:staffUserId', pharmaAdminController.getPharmaStaffMember);

/**
 * @openapi
 * /pharma-admin/staff/{staffUserId}/status:
 *   patch:
 *     tags:
 *       - Pharma Admin - Staff Management
 *     summary: Update pharmacy staff member's account status
 *     description: Activates or deactivates a staff member's account within the pharma admin's organization.
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
 *         description: Pharmacy staff member status updated successfully.
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
 *                   example: Pharmacy staff member status updated.
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

router.patch('/staff/:staffUserId/status', validateRequest(updatePharmaStaffStatusSchema, 'body'), pharmaAdminController.updatePharmaStaffStatus);

export default router;