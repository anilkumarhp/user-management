import swaggerJsdoc from 'swagger-jsdoc';
import config from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'User Management Service API',
    version: '1.0.0',
    description:
      'API documentation for the User Management microservice, part of the Hospital and Patient Data Management System.',
    contact: {
      name: 'API Support',
      url: '[http://your-support-url.com](http://your-support-url.com)', 
      email: 'support@example.com',    
    },
    license: {
      name: 'ISC', 
      url: '[https://opensource.org/licenses/ISC](https://opensource.org/licenses/ISC)',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}${config.apiBasePath}`,
      description: 'Development server',
    },
  ],
  tags: [ // Explicitly define all tags here
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'Organizations',
      description: 'Organization registration and management (public-facing)'
    },
    {
      name: 'Admin - User Management',
      description: 'APIs for system administrators to manage users'
    },
    {
      name: 'Admin - Organization Management',
      description: 'APIs for system administrators to manage organization registrations'
    },
    {
      name: 'Hospital Admin - Staff Management', // New Tag
      description: 'APIs for Hospital Administrators to manage their staff'
    },
    {
      name: 'Pharma Admin - Staff Management', // New Tag
      description: 'APIs for Pharma Administrators to manage their staff'
    },
    {
      name: 'Lab Admin - Staff Management', // New Tag
      description: 'APIs for LAB Administrators to manage their staff'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { 
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', 
      },
    },
    schemas: { 
        User: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                full_name: { type: 'string', example: 'John Doe', nullable: true },
                roles: { type: 'array', items: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'SYSTEM_ADMIN'] }, example: ['PATIENT'] },
                is_active: { type: 'boolean', example: true },
                is_email_verified: { type: 'boolean', example: false },
                employeeId: { type: 'string', nullable: true, example: 'EMP123'},
                department: { type: 'string', nullable: true, example: 'Cardiology'},
                created_at: { type: 'string', format: 'date-time' },
                updated_at: { type: 'string', format: 'date-time' },
            }
        },
        UserWithPasswordHash: { 
            allOf: [
                { $ref: '#/components/schemas/User' },
                {
                    type: 'object',
                    properties: {
                        password_hash: { type: 'string', description: 'Hashed password of the user' }
                    }
                }
            ]
        },
        ErrorResponse: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'error' },
                message: { type: 'string', example: 'An error occurred.' },
                errors: { type: 'array', items: { type: 'object' }, nullable: true },
                stack: { type: 'string', nullable: true, description: 'Stack trace (only in development)'}
            }
        },
        ValidationErrorResponse: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'error' },
                message: { type: 'string', example: 'Validation failed' },
                errors: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            field: { type: 'string', example: 'email' },
                            message: { type: 'string', example: 'Email is required.' }
                        }
                    }
                }
            }
        },
        UpdateUserRolesInput: {
            type: 'object',
            required: ['roles'],
            properties: {
                roles: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['PATIENT', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'STAFF', 'PHARMA_ADMIN', 'LAB_ADMIN', 'SYSTEM_ADMIN']
                    },
                    description: "Array of roles to assign to the user."
                }
            }
        },
        UpdateUserStatusInput: {
            type: 'object',
            required: ['isActive'],
            properties: {
                isActive: {
                    type: 'boolean',
                    description: "Set user account to active or inactive."
                }
            }
        },
        OrganizationTypeEnum: {
            type: 'string',
            enum: ['HOSPITAL', 'PHARMACY', 'LAB']
        },
        OrganizationStatusEnum: {
            type: 'string',
            enum: ['PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED']
        },
        OrganizationRegistrationInput: {
            type: 'object',
            required: ['name', 'type', 'contactPersonName', 'contactPersonEmail'],
            properties: {
                name: { type: 'string', example: 'City General Hospital' },
                type: { $ref: '#/components/schemas/OrganizationTypeEnum' },
                licenseNumber: { type: 'string', nullable: true, example: 'LIC12345' },
                address: { type: 'string', nullable: true, example: '123 Main St, Anytown' },
                contactPersonName: { type: 'string', example: 'Jane Doe' },
                contactPersonEmail: { type: 'string', format: 'email', example: 'jane.doe@hospital.com' },
                contactPersonMobile: { type: 'string', nullable: true, example: '+15551237890' }
            }
        },
        OrganizationResponse: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                type: { $ref: '#/components/schemas/OrganizationTypeEnum' },
                licenseNumber: { type: 'string', nullable: true },
                address: { type: 'string', nullable: true },
                contactPersonName: { type: 'string' },
                contactPersonEmail: { type: 'string', format: 'email' },
                contactPersonMobile: { type: 'string', nullable: true },
                status: { $ref: '#/components/schemas/OrganizationStatusEnum' },
                adminUserId: { type: 'string', format: 'uuid', nullable: true, description: "ID of the admin user for this organization" },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            }
        },
        ApproveRejectOrganizationInput: {
            type: 'object',
            properties: {
                rejectionReason: { type: 'string', nullable: true, description: "Reason for rejection (only if rejecting)"}
            }
        },
        PaginationMeta: { 
            type: 'object',
            properties: {
                total: { type: 'integer', example: 100 },
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                totalPages: { type: 'integer', example: 10 }
            }
        },
        CreateStaffInput: {
            type: 'object',
            required: ['email', 'password', 'fullName', 'role'],
            properties: {
                email: { type: 'string', format: 'email', description: "Staff member's email" },
                password: { type: 'string', format: 'password', minLength: 8, description: "Staff member's password" },
                fullName: { type: 'string', description: "Staff member's full name" },
                role: { $ref: '#/components/schemas/UserRoleEnum', description: "Role to assign (e.g., DOCTOR, NURSE, STAFF)"},
                employeeId: { type: 'string', nullable: true, description: "Employee ID for the staff member" },
                department: { type: 'string', nullable: true, description: "Department for the staff member" }
            }
        },
        StaffUserResponse: { // Can reuse AuthenticatedUserResponse or define more specific one
            allOf: [
                { $ref: '#/components/schemas/AuthenticatedUserResponse' },
                {
                    type: 'object',
                    properties: {
                        employeeId: { type: 'string', nullable: true },
                        department: { type: 'string', nullable: true }
                    }
                }
            ]
        }
    },
    responses: { 
        UnauthorizedError: {
            description: 'Unauthorized - Access token is missing, invalid, or expired.',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        },
        ForbiddenError: {
            description: 'Forbidden - User does not have sufficient permissions.',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        },
        NotFoundError: {
            description: 'Resource not found.',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        },
        ValidationError: {
            description: 'Input validation failed.',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ValidationErrorResponse' }
                }
            }
        },
        InternalServerError: {
            description: 'Internal server error.',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
            }
        }
    },
    parameters: { 
        PageQueryParam: {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination.',
            required: false,
            schema: {
                type: 'integer',
                default: 1,
                minimum: 1
            }
        },
        LimitQueryParam: {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page.',
            required: false,
            schema: {
                type: 'integer',
                default: 10,
                minimum: 1,
                maximum: 100
            }
        }
    },
  },
  security: [ 
    {
      bearerAuth: [], 
    },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/api/v1/routes/*.ts', './src/interfaces/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;