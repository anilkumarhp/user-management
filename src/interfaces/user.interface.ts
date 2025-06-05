import { UserRoles as AppUserRoles } from '@/constants/roles.constants'; 
import { User as PrismaUser, UserRole as PrismaUserRole } from '@prisma/client';


/**
 * @openapi
 * components:
 *   schemas:
 *     UserMinimum:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the user.
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user.
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [PATIENT, HOSPITAL_ADMIN, DOCTOR, NURSE, STAFF, PHARMA_ADMIN, LAB_ADMIN, SYSTEM_ADMIN]
 *           description: Roles assigned to the user.
 * 
 *     AuthenticatedUserResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/UserMinimum'
 *         - type: object
 *           properties:
 *             full_name:
 *               type: string
 *               nullable: true
 *               description: The full name of the user.
 *             is_active:
 *               type: boolean
 *             is_email_verified:
 *               type: boolean
 *             created_at:
 *               type: string
 *               format: date-time
 *             updated_at:
 *               type: string
 *               format: date-time
 *             organizationId:
 *               type: string
 *               format: uuid
 *               nullable: true
 *               description: The ID of the organization this user is associated with as an admin or staff.
 *             employeeId:
 *               type: string
 *               nullable: true
 *               description: Employee ID, if applicable.
 *             department:
 *               type: string
 *               nullable: true
 *               description: Department, if applicable.
 *             staffOrganizationId:
 *               type: string
 *               format: uuid
 *               nullable: true
 *               description: The ID of the organization this user is associated with as a staff member.
 * 
 *     UserRegistrationInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address.
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: User's password (min 8 characters).
 *         full_name:
 *           type: string
 *           nullable: true
 *           description: User's full name.
 * 
 *     UserLoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 * 
 *     RefreshTokenInput:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 * 
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           description: JWT access token.
 *         refreshToken:
 *           type: string
 *           description: JWT refresh token.
 * 
 *     AdminUpdateUserRolesDto:
 *       type: object
 *       required:
 *         - roles
 *       properties:
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserRoleEnum'
 *           description: Array of roles to assign to the user.
 *           example: [PATIENT, DOCTOR]
 * 
 *     AdminUpdateUserStatusDto:
 *       type: object
 *       required:
 *         - isActive
 *       properties:
 *         isActive:
 *           type: boolean
 *           description: Set user account to active (true) or inactive (false).
 * 
 *     CreateStaffMemberDto:
 *       type: object
 *       required:
 *         - email
 *         - fullName
 *         - role
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Staff member's email.
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           nullable: true
 *           description: Staff member's password (optional, will be auto-generated if not provided).
 *         fullName:
 *           type: string
 *           description: Staff member's full name.
 *         role:
 *           $ref: '#/components/schemas/UserRoleEnum'
 *         employeeId:
 *           type: string
 *           nullable: true
 *           description: Employee ID for the staff member.
 *         department:
 *           type: string
 *           nullable: true
 *           description: Department for the staff member.
 * 
 *     UserRoleEnum:
 *       type: string
 *       enum: [PATIENT, HOSPITAL_ADMIN, DOCTOR, NURSE, STAFF, PHARMA_ADMIN, LAB_ADMIN, SYSTEM_ADMIN]
 * 
 *     UpdateUserProfileDto:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *           nullable: true
 *           description: User's full name.
 *           example: 'Jane Doe Updated'
 *         department:
 *           type: string
 *           nullable: true
 *           maxLength: 100
 *           description: User's department (if applicable).
 *         employeeId:
 *           type: string
 *           nullable: true
 *           maxLength: 50
 *           description: User's employee ID (if applicable).
 * 
 *     ChangePasswordDto:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: The user's current password.
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: The new password (must be at least 8 characters).
 * 
 *     ForgotPasswordRequestDto:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The email address of the user requesting a password reset.
 * 
 *     ResetPasswordRequestDto:
 *       type: object
 *       required:
 *         - token
 *         - newPassword
 *       properties:
 *         token:
 *           type: string
 *           description: The password reset token received by the user.
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: The new password for the user.
 */


// Base User interface for application logic (includes password_hash for service layer)
export interface User {
  id: string; 
  email: string;
  password_hash: string; 
  full_name?: string; 
  roles: AppUserRoles[];
  mobile_code: string;
  mobile: number;
  phone_code: string | null;
  phone: number | null;
  address: string;
  pin_code: string;
  is_active: boolean;
  is_email_verified: boolean; 
  employeeId?: string | null;
  department?: string | null;
  created_at: Date;
  updated_at: Date;
  organizationId?: string | null; 
  staffOrganizationId?: string | null; 
}

// Interface for the user object attached to req.user by authentication middleware
// and also used as the base for JWT payload.
export interface AuthenticatedUser { 
  id: string;
  email: string;
  roles: AppUserRoles[]; 
  organizationId?: string | null; 
}

// Interface for API responses representing a user (without sensitive data like password_hash)
// This matches the OpenAPI schema 'AuthenticatedUserResponse'
// From src/interfaces/user.interface.ts in the Canvas
export interface AuthenticatedUserResponse {
    id: string;
    email: string;
    full_name?: string;
    roles: AppUserRoles[];
    is_active: boolean;
    is_email_verified: boolean;
    employeeId?: string | null;
    department?: string | null;
    created_at: string; // ISO string for API responses
    updated_at: string; // ISO string for API responses
    organizationId?: string | null;
    staffOrganizationId?: string | null; // It's defined here
}


export type CreateUserDto = Pick<User, 'email'> & { 
  password_hash: string; 
  full_name?: string;
  roles: AppUserRoles[];
  mobile_code?: string,
  mobile?: number                   
  address?: string,
  pin_code?: string,
  organizationId?: string | null; 
  staffOrganizationId?: string | null; 
  employeeId?: string | null;
  department?: string | null;
};

export interface UserUpdateDto {
  email?: string;
  fullName?: string | null;
  roles?: AppUserRoles[];
  mobileCode?: string | null;
  mobile?: number | null;
  phoneCode?: string | null;
  phone?: number | null;
  address?: string | null;
  pinCode?: string | null;
  isActive?: boolean;
  employeeId?: string | null;
  department?: string | null;
  organizationId?: string | null;     // Foreign Key: ID of the organization this user administers
  staffOrganizationId?: string | null; // Foreign Key: ID of the organization this user is staff of
}

export type RegisterUserDto = Pick<User, 'email'> & { 
    password: string; 
    full_name?: string;
};

// DTOs for Admin operations
export interface AdminUpdateUserRolesDto {
    roles: AppUserRoles[];
}

export interface AdminUpdateUserStatusDto {
    isActive: boolean;
}

// DTO for Hospital Admin creating staff
export interface CreateStaffMemberDto {
    email: string;
    password?: string; 
    fullName: string;
    role: AppUserRoles; 
    employeeId?: string;
    department?: string;
}

// DTOs for password reset
export interface ForgotPasswordRequestDto {
    email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Helper type for Prisma User with its roles (if needed directly, though mapping is preferred)
export type PrismaUserWithRoles = PrismaUser;

// Type alias for Prisma's UserRole enum for clarity in services if needed
export type PrismaUserRoleType = PrismaUserRole;



