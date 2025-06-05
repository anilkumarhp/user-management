// File: src/api/v1/validators/pharmaAdmin.validator.ts
import Joi from 'joi';
import { UserRoles } from '@/constants/roles.constants';

// Define roles that a Pharma Admin can assign to their staff
const assignableStaffRolesByPharmaAdmin = [UserRoles.STAFF]; // Example: Pharmacist, Technician could be specific STAFF types

export const createPharmaStaffSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).optional().allow(null, ''),
  fullName: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid(...assignableStaffRolesByPharmaAdmin).required().messages({
    'any.only': `Role must be one of [${assignableStaffRolesByPharmaAdmin.join(', ')}]`
  }),
  employeeId: Joi.string().optional().allow(null, '').max(50),
  department: Joi.string().optional().allow(null, '').max(100), // e.g., "Dispensing", "Compounding"
});

export const listPharmaStaffQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const updatePharmaStaffStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});


