import prisma from '@/database/client';
import { User as PrismaUserFromGenerated, UserRole as PrismaUserRoleType, Organization as PrismaOrganization, OrganizationStatus as PrismaOrganizationStatus } from '@prisma/client';
import { User, AdminUpdateUserRolesDto, AdminUpdateUserStatusDto, AuthenticatedUserResponse } from '@/interfaces/user.interface';
import {OrganizationWithAdmin} from '@/interfaces/organization.interface'
import { Organization as AppOrganization, CreateOrganizationDto } from '@/interfaces/organization.interface';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants';
import { OrganizationStatus as AppOrganizationStatus, OrganizationType as AppOrganizationType } from '@/constants/organization.constants';
import { mapToUserInterface, mapAppRolesToPrismaRoles, mapToAuthenticatedUserResponse, createUser } from './user.service'; 
import { hashPassword } from '@/utils/password.util';
import logger from '@/utils/logger.utils';


// Helper to map Prisma Organization to App Organization interface
const mapToOrganizationInterface = (org: PrismaOrganization & { adminUser?: PrismaUserFromGenerated | null }): OrganizationWithAdmin | null => {
    if (!org) return null;
    return {
        id: org.id,
        name: org.name,
        type: org.type as AppOrganizationType, // Cast from Prisma enum to App enum
        licenseNumber: org.licenseNumber,
        licenseDocumentS3Path: org.licenseDocumentS3Path,
        address: org.address,
        contactPersonName: org.contactPersonName,
        contactPersonEmail: org.contactPersonEmail,
        contactPersonMobile: org.contactPersonMobile,
        status: org.status as AppOrganizationStatus, // Cast
        adminUserId: org.adminUser?.id || null, // Get admin user ID if adminUser is populated
        adminUser: org.adminUser ? mapToAuthenticatedUserResponse(org.adminUser) : null,
        rejectionReason: org.rejectionReason,
        approvedBy: org.approvedBy,
        approvedAt: org.approvedAt,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
    };
};


export const getAllUsersService = async (page: number, limit: number): Promise<{ users: AuthenticatedUserResponse[], total: number, page: number, limit: number }> => {
  try {
    const skip = (page - 1) * limit;
    const take = limit;

    const prismaUsers = await prisma.user.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
    const totalUsers = await prisma.user.count();
    
    const users = prismaUsers.map(user => mapToAuthenticatedUserResponse(user)).filter(user => user !== null) as AuthenticatedUserResponse[];
    
    return { users, total: totalUsers, page, limit };
  } catch (error) {
    logger.error('Error fetching all users:', error);
    throw new Error('Could not retrieve users.');
  }
};

export const getUserByIdService = async (userId: string): Promise<AuthenticatedUserResponse | null> => {
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    return mapToAuthenticatedUserResponse(prismaUser);
  } catch (error) {
    logger.error(`Error fetching user by ID ${userId}:`, error);
    throw new Error('Could not retrieve user.');
  }
};

export const updateUserStatusService = async (userId: string, statusData: AdminUpdateUserStatusDto): Promise<AuthenticatedUserResponse | null> => {
  try {
    const prismaUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: statusData.isActive,
      },
    });
    return mapToAuthenticatedUserResponse(prismaUser);
  } catch (error: any) {
    logger.error(`Error updating status for user ID ${userId}:`, error);
    if (error.code === 'P2025') { 
      return null;
    }
    throw new Error('Could not update user status.');
  }
};

export const updateUserRolesService = async (userId: string, rolesData: AdminUpdateUserRolesDto): Promise<AuthenticatedUserResponse | null> => {
  try {
    const validAppRoles = rolesData.roles.filter(role => AppUserRoles[role as keyof typeof AppUserRoles]);
    if (validAppRoles.length !== rolesData.roles.length) {
        throw new Error('Invalid role(s) provided.');
    }

    const prismaRoles = mapAppRolesToPrismaRoles(validAppRoles);

    const prismaUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: prismaRoles,
      },
    });
    return mapToAuthenticatedUserResponse(prismaUser);
  } catch (error: any) {
    logger.error(`Error updating roles for user ID ${userId}:`, error);
    if (error.code === 'P2025') { 
      return null;
    }
    throw new Error('Could not update user roles.');
  }
};

export const getPendingOrganizationsService = async (page: number, limit: number): Promise<{ organizations: OrganizationWithAdmin[], total: number, page: number, limit: number }> => {
    try {
        const skip = (page - 1) * limit;
        const take = limit;
        const organizations = await prisma.organization.findMany({
            where: { status: PrismaOrganizationStatus.PENDING_VERIFICATION },
            skip,
            take,
            orderBy: { createdAt: 'asc' },
            include: { adminUser: true } // Include adminUser if you want to show details
        });
        const total = await prisma.organization.count({
            where: { status: PrismaOrganizationStatus.PENDING_VERIFICATION },
        });
        return {
            organizations: organizations.map(org => mapToOrganizationInterface(org)).filter(org => org !== null) as OrganizationWithAdmin[],
            total,
            page,
            limit
        };
    } catch (error) {
        logger.error('Error fetching pending organizations:', error);
        throw new Error('Could not retrieve pending organizations.');
    }
};

export const approveOrganizationService = async (orgId: string, systemAdminId: string): Promise<OrganizationWithAdmin | null> => {
    const organization = await prisma.organization.findUnique({
        where: { id: orgId, status: PrismaOrganizationStatus.PENDING_VERIFICATION },
    });

    if (!organization) {
        logger.warn(`Attempted to approve non-existent or already processed organization: ${orgId}`);
        return null; 
    }

    const tempPassword = `OrgAdmin!${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await hashPassword(tempPassword);

    let orgAdminRole: AppUserRoles;
    switch (organization.type) {
        case 'HOSPITAL': orgAdminRole = AppUserRoles.HOSPITAL_ADMIN; break;
        case 'PHARMACY': orgAdminRole = AppUserRoles.PHARMA_ADMIN; break;
        case 'LAB': orgAdminRole = AppUserRoles.LAB_ADMIN; break;
        default: throw new Error('Invalid organization type for admin role assignment.');
    }
    
    try {
        // Use a transaction to ensure both org update and user creation/update succeed or fail together
        const updatedOrganizationWithAdmin = await prisma.$transaction(async (tx) => {
            const orgAdminUser = await createUser({ // Using our existing createUser from user.service
                email: organization.contactPersonEmail,
                password_hash: hashedPassword,
                full_name: organization.contactPersonName,
                roles: [orgAdminRole, AppUserRoles.PATIENT], 
                organizationId: organization.id, // This links the User to the Organization as its admin via the 1-to-1 relation
            });
    
            const updatedOrg = await tx.organization.update({
                where: { id: orgId },
                data: {
                    status: PrismaOrganizationStatus.ACTIVE,
                    approvedBy: systemAdminId,
                    approvedAt: new Date(),
                    // adminUser is connected implicitly by Prisma due to the relation and unique organizationId on User
                },
                include: { adminUser: true } // Include adminUser to get the full details after update
            });
            return updatedOrg;
        });

        logger.info(`Organization ${orgId} approved. Admin user ${updatedOrganizationWithAdmin.adminUser?.email} created/linked. Temp password: ${tempPassword}`);
        // IMPORTANT: In a real app, this tempPassword needs to be communicated securely or use an invite flow.

        return mapToOrganizationInterface(updatedOrganizationWithAdmin);

    } catch (error: any) {
        logger.error(`Error approving organization ${orgId}:`, error);
        if (error.message.includes('User with this email already exists')) {
            throw new Error(`Failed to create admin user for organization: Email ${organization.contactPersonEmail} already exists as a user.`);
        }
        throw new Error('Could not approve organization due to an internal error.');
    }
};

export const rejectOrganizationService = async (orgId: string, systemAdminId: string, rejectionReason?: string): Promise<OrganizationWithAdmin | null> => {
  const organization = await prisma.organization.findUnique({
        where: { id: orgId, status: PrismaOrganizationStatus.PENDING_VERIFICATION },
  });
  if (!organization) {
    logger.warn(`Attempted to reject non-existent or already processed organization: ${orgId}`);
    return null; 
  }  
  
  const updatedOrganization = await prisma.organization.update({
        where: { id: orgId, status: PrismaOrganizationStatus.PENDING_VERIFICATION },
        data: {
            status: PrismaOrganizationStatus.REJECTED,
            rejectionReason: rejectionReason || 'Rejected by system administrator.',
            approvedBy: systemAdminId, // Log who rejected
            approvedAt: new Date(),   // Log time of rejection
        },
        include: { adminUser: true }
    });
    if (!updatedOrganization) return null; // Should not happen if status was PENDING_VERIFICATION
    logger.info(`Organization ${orgId} rejected. Reason: ${rejectionReason}`);
    return mapToOrganizationInterface(updatedOrganization);
};