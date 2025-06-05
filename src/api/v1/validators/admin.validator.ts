import Joi from 'joi';
import { ALL_ROLES, UserRoles } from '@/constants/roles.constants'; // Assuming UserRoles values are strings

export const updateUserStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

export const updateUserRolesSchema = Joi.object({
  roles: Joi.array().items(Joi.string().valid(...Object.values(UserRoles))).min(1).required().messages({
    'array.min': 'At least one role must be provided.',
    'any.required': 'Roles array is required.',
    'any.only': 'Invalid role provided. Must be one of {{#valids}}.', // #valids will be replaced by Joi
  }),
});

export const listUsersQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    // Add other query params like role, status etc. later
});

export const approveRejectOrganizationSchema = Joi.object({
    rejectionReason: Joi.string().optional().allow('').max(500),
});