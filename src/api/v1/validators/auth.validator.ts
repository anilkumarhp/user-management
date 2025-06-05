import Joi from 'joi';
import { z } from 'zod';
import { RegisterUserDto } from '@/interfaces/user.interface';

export const registerUserSchema = Joi.object<RegisterUserDto>({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string().min(8).required().messages({ // Add password complexity rules as needed
    'string.min': 'Password must be at least 8 characters long.',
    'any.required': 'Password is required.',
  }),
  full_name: Joi.string().optional().allow('').max(100),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be a string.',
    'string.email': 'Email must be a valid email address.',
    'any.required': 'Email is required.',
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.base': 'Token must be a string',
    'any.required': 'Token is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/[a-z]/, 'lowercase letter')
    .pattern(/[A-Z]/, 'uppercase letter')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^a-zA-Z0-9]/, 'special character')
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.name': 'Password must contain at least one {#name}',
      'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.only': 'Passwords don’t match',
      'any.required': 'Confirm password is required',
    }),
});
