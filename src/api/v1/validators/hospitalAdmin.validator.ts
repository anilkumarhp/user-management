import Joi from 'joi';
import { UserRoles } from '@/constants/roles.constants';

// Define roles that a Hospital Admin can assign to their staff
const assignableStaffRoles = [UserRoles.DOCTOR, UserRoles.NURSE, UserRoles.STAFF];

export const createStaffMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).optional().allow(null, ''), // Password is optional, will be auto-generated if not provided
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid(...assignableStaffRoles).required().messages({
    'any.only': `Role must be one of [${assignableStaffRoles.join(', ')}]`
  }),
  employeeId: Joi.string().optional().allow(null, '').max(50),
  department: Joi.string().optional().allow(null, '').max(100),
});

export const listStaffQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  // Add other query params like role, status etc. later
});

export const updateStaffStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});