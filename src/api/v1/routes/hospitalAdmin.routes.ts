import { Router } from 'express';
import * as hospitalAdminController from '@/api/v1/controllers/hospitalAdmin.controller';
import { authenticateToken, authorizeRoles } from '@/api/v1/middlewares/auth.middleware';
import validateRequest from '@/api/v1/middlewares/validation.middleware';
import { 
    createStaffMemberSchema, 
    listStaffQuerySchema, 
    updateStaffStatusSchema 
} from '@/api/v1/validators/hospitalAdmin.validator';
import { UserRoles } from '@/constants/roles.constants';
import logger from '@/utils/logger.utils';

const router = Router();

// Middleware to log entry into hospital admin routes
router.use((req, res, next) => {
    logger.debug(`HOSPITAL ADMIN ROUTER: Path - ${req.path}, OriginalURL - ${req.originalUrl}, BaseURL - ${req.baseUrl}`);
    next();
});

// All hospital admin routes require HOSPITAL_ADMIN role and authentication
router.use(authenticateToken, authorizeRoles([UserRoles.HOSPITAL_ADMIN]));

/**
 * @openapi
 * tags:
 * - name: Hospital Admin - Staff Management
 *   description: APIs for Hospital Administrators to manage their staff
 */

/**
 * @openapi
 * /hospital-admin/staff:
 *   post:
 *     tags:
 *       - Hospital Admin - Staff Management
 *     summary: Create a new staff member
 *     description: Allows a Hospital Admin to create a new staff member (Doctor, Nurse, Staff) for their organization.
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
 *         description: Staff member created successfully. Temporary password logged for development.
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
 *                   example: Staff member created successfully.
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

router.post('/staff', validateRequest(createStaffMemberSchema, 'body'), hospitalAdminController.createStaffMember);

/**
 * @openapi
 * /hospital-admin/staff:
 *   get:
 *     tags:
 *       - Hospital Admin - Staff Management
 *     summary: List staff members of the hospital
 *     description: Retrieves a paginated list of staff members associated with the hospital admin's organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageQueryParam'
 *       - $ref: '#/components/parameters/LimitQueryParam'
 *     responses:
 *       '200':
 *         description: A list of staff members.
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
 *                   example: Staff members fetched successfully.
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

router.get('/staff', validateRequest(listStaffQuerySchema, 'query'), hospitalAdminController.listStaff);
/**
 * @openapi
 * /hospital-admin/staff/{staffUserId}:
 *   get:
 *     tags:
 *       - Hospital Admin - Staff Management
 *     summary: Get details of a specific staff member
 *     description: Retrieves details for a specific staff member within the hospital admin's organization.
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
 *         description: Staff member details.
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

router.get('/staff/:staffUserId', hospitalAdminController.getStaffMember);

/**
 * @openapi
 * /hospital-admin/staff/{staffUserId}:
 *   get:
 *     tags:
 *       - Hospital Admin - Staff Management
 *     summary: Get details of a specific staff member
 *     description: Retrieves details for a specific staff member within the hospital admin's organization.
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
 *         description: Staff member details.
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

router.patch('/staff/:staffUserId/status', validateRequest(updateStaffStatusSchema, 'body'), hospitalAdminController.updateStaffStatus);


export default router;