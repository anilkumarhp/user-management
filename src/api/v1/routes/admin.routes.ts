import { Router } from 'express';
import * as adminController from '@/api/v1/controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '@/api/v1/middlewares/auth.middleware';
import validateRequest from '@/api/v1/middlewares/validation.middleware';
import { updateUserStatusSchema, updateUserRolesSchema, listUsersQuerySchema, approveRejectOrganizationSchema } from '@/api/v1/validators/admin.validator';
import { UserRoles } from '@/constants/roles.constants';
import logger from '@/utils/logger.utils'; 

const router = Router();

router.use((req, res, next) => {
    logger.debug(`ADMIN ROUTER: Path - ${req.path}, OriginalURL - ${req.originalUrl}, BaseURL - ${req.baseUrl}`);
    next();
});

// All admin routes require SYSTEM_ADMIN role and authentication
router.use(authenticateToken, authorizeRoles([UserRoles.SYSTEM_ADMIN]));

/**
 * @openapi
 * tags:
 *   - name: Admin - User Management
 *     description: APIs for system administrators to manage users
 *   - name: Admin - Organization Management
 *     description: APIs for system administrators to manage organization registrations
 */

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: List all users
 *     description: Retrieves a paginated list of all users. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page.
 *     responses:
 *       '200':
 *         description: A list of users.
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
 *                   example: Users fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuthenticatedUserResponse'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users', validateRequest(listUsersQuerySchema, 'query'), adminController.listUsers);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags:
 *       - Admin - User Management
 *     summary: Get user details by ID
 *     description: Retrieves details for a specific user. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user to retrieve.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: User details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/users/:userId', adminController.getUserDetails);

/**
 * @openapi
 * /admin/users/{userId}/status:
 *   patch:
 *     tags:
 *       - Admin - User Management
 *     summary: Update user account status (activate/deactivate)
 *     description: Activates or deactivates a user account. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user to update.
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
 *         description: User status updated successfully.
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
 *                   example: User status updated.
 *                 data:
 *                   $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: User not found.
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/users/:userId/status', validateRequest(updateUserStatusSchema, 'body'), adminController.updateUserStatus);

/**
 * @openapi
 * /admin/users/{userId}/roles:
 *   patch:
 *     tags:
 *       - Admin - User Management
 *     summary: Update user roles
 *     description: Updates the roles assigned to a user. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user to update.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateUserRolesDto'
 *     responses:
 *       '200':
 *         description: User roles updated successfully.
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
 *                   example: User roles updated.
 *                 data:
 *                   $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: User not found.
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/users/:userId/roles', validateRequest(updateUserRolesSchema, 'body'), adminController.updateUserRoles);

// Organization Management by Admin

/**
 * @openapi
 * /admin/organizations/pending:
 *   get:
 *     tags:
 *       - Admin - Organization Management
 *     summary: List pending organization registrations
 *     description: Retrieves a paginated list of organizations awaiting verification. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageQueryParam'
 *       - $ref: '#/components/parameters/LimitQueryParam'
 *     responses:
 *       '200':
 *         description: A list of pending organizations.
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
 *                   example: Pending organizations fetched successfully.
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrganizationFullResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.get('/organizations/pending', validateRequest(listUsersQuerySchema, 'query'), adminController.listPendingOrganizations); // Reusing listUsersQuerySchema for pagination

/**
 * @openapi
 * /admin/organizations/{orgId}/approve:
 *   patch:
 *     tags:
 *       - Admin - Organization Management
 *     summary: Approve an organization registration
 *     description: Approves a pending organization registration, creates an admin user for it, and sets its status to ACTIVE. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orgId
 *         in: path
 *         required: true
 *         description: ID of the organization to approve.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Organization approved successfully.
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
 *                   example: Organization approved successfully.
 *                 data:
 *                   $ref: '#/components/schemas/OrganizationFullResponse'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Organization not found or not pending approval.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */

router.patch('/organizations/:orgId/approve', adminController.approveOrganization);

/**
 * @openapi
 * /admin/organizations/{orgId}/reject:
 *   patch:
 *     tags:
 *       - Admin - Organization Management
 *     summary: Reject an organization registration
 *     description: Rejects a pending organization registration and sets its status to REJECTED. Requires SYSTEM_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orgId
 *         in: path
 *         required: true
 *         description: ID of the organization to reject.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApproveRejectOrganizationInput'
 *     responses:
 *       '200':
 *         description: Organization rejected successfully.
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
 *                   example: Organization rejected.
 *                 data:
 *                   $ref: '#/components/schemas/OrganizationFullResponse'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '403':
 *         $ref: '#/components/responses/ForbiddenError'
 *       '404':
 *         description: Organization not found or not pending approval.
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
*/
router.patch('/organizations/:orgId/reject', validateRequest(approveRejectOrganizationSchema, 'body'), adminController.rejectOrganization);

export default router;
