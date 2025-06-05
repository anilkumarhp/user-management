import Joi from 'joi';
import { ALL_ORGANIZATION_TYPES } from '@/constants/organization.constants';

export const organizationRegistrationSchema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    type: Joi.string().valid(...ALL_ORGANIZATION_TYPES).required(),
    licenseNumber: Joi.string().optional().allow(null, '').max(100),
    address: Joi.string().optional().allow(null, '').max(500),
    contactPersonName: Joi.string().min(2).max(100).required(),
    contactPersonEmail: Joi.string().email().required(),
    contactPersonMobile: Joi.string().optional().allow(null, '').max(20),
});