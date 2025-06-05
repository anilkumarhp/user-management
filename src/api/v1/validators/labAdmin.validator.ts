// File: src/api/v1/validators/labAdmin.validator.ts
import Joi from 'joi';
import { UserRoles } from '@/constants/roles.constants';

const assignableStaffRolesByLabAdmin = [UserRoles.STAFF]; // Example: Lab Technician, Pathologist

export const createLabStaffSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).optional().allow(null, ''),
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid(...assignableStaffRolesByLabAdmin).required().messages({
    'any.only': `Role must be one of [${assignableStaffRolesByLabAdmin.join(', ')}]`
  }),
  employeeId: Joi.string().optional().allow(null, '').max(50),
  department: Joi.string().optional().allow(null, '').max(100), // e.g., "Pathology", "Microbiology"
});

export const listLabStaffQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const updateLabStaffStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});