import {Router} from 'express';
import * as userController from '@/api/v1/controllers/user.controller';
//import {userUpdateSchema} from '@/api/v1/'

const router = Router();

/**
 * @openapi
 * tags:
 * - name: Users
 *   description: User management operations
 */

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update user details
 *     description: Partially updates an existing user's information. Requires authentication.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user to update.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInput'
 *     responses:
 *       '200':
 *         description: User updated successfully.
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
 *                   example: User updated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       '400':
 *         description: Validation error or invalid input.
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *                 - $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized. Authentication token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User does not have permission to update this resource.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found.
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
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/users/:id',
  // authMiddleware, // Protect the route
  // validateRequest(userIdSchema, 'params'), // Validate path parameter
  // validateRequest(updateUserSchema, 'body'), // Validate request body
  userController.updateUser // Your controller method
);


/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user
 *     description: Deletes an existing user account. Requires authentication and appropriate permissions.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the user to delete.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: User deleted successfully.
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
 *                   example: User deleted successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/AuthenticatedUserResponse'
 *       # Uncomment this section if you prefer a 204 No Content response instead of returning user data
 *       # '204':
 *       #   description: User deleted successfully. No content.
 *       '401':
 *         description: Unauthorized. Authentication token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden. User does not have permission to delete this resource.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: User not found.
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
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/users/:id',
  // authMiddleware, // Protect the route
  // validateRequest(userIdSchema, 'params'), // Validate path parameter
  // userController.deleteUser // Your controller method
);