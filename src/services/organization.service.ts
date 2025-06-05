import prisma from '@/database/client';
import { 
    Organization as PrismaOrganization, 
    OrganizationType as PrismaOrganizationType,
    OrganizationStatus as PrismaOrganizationStatus,
    UserRole as PrismaUserRole,
    User as PrismaUser // Explicitly import Prisma User type
} from '@prisma/client';
import { 
    Organization, 
    CreateOrganizationDto, 
    OrganizationWithAdmin 
} from '@/interfaces/organization.interface';
import { 
    OrganizationType as AppOrganizationType, 
    OrganizationStatus as AppOrganizationStatus 
} from '@/constants/organization.constants';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants';
import { mapToAuthenticatedUserResponse } from './user.service'; // For mapping admin user
import logger from '@/utils/logger.utils';

// Helper to map Prisma Organization to App Organization interface
export const mapToOrganizationInterfaceService = (org: PrismaOrganization & { adminUser?: PrismaUser | null }): OrganizationWithAdmin | null => { // Use imported PrismaUser
    if (!org) return null;
    
    return {
        id: org.id,
        name: org.name,
        type: org.type as AppOrganizationType, 
        licenseNumber: org.licenseNumber,
        licenseDocumentS3Path: org.licenseDocumentS3Path,
        address: org.address,
        contactPersonName: org.contactPersonName,
        contactPersonEmail: org.contactPersonEmail,
        contactPersonMobile: org.contactPersonMobile,
        status: org.status as AppOrganizationStatus, 
        adminUserId: org.adminUser?.id || null, 
        adminUser: org.adminUser ? mapToAuthenticatedUserResponse(org.adminUser) : null,
        rejectionReason: org.rejectionReason,
        approvedBy: org.approvedBy,
        approvedAt: org.approvedAt,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
    };
};


export const registerNewOrganizationService = async (orgData: CreateOrganizationDto): Promise<Organization> => {
    try {
        // Ensure contactPersonEmail is unique across pending/active organizations
        const existingOrgByContactEmail = await prisma.organization.findUnique({
            where: { contactPersonEmail: orgData.contactPersonEmail.toLowerCase() }
        });
        if (existingOrgByContactEmail) {
            throw new Error('An organization with this contact email already exists or is pending verification.');
        }

        const newOrganization = await prisma.organization.create({
            data: {
                name: orgData.name,
                type: orgData.type as PrismaOrganizationType, // Cast to Prisma's enum type
                licenseNumber: orgData.licenseNumber,
                address: orgData.address,
                contactPersonName: orgData.contactPersonName,
                contactPersonEmail: orgData.contactPersonEmail.toLowerCase(), // Store normalized
                contactPersonMobile: orgData.contactPersonMobile,
                status: PrismaOrganizationStatus.PENDING_VERIFICATION, // Default status
            },
        });
        // Cast to include adminUser as potentially null for the mapper, even though it won't be populated on create
        const mappedOrg = mapToOrganizationInterfaceService(newOrganization as (PrismaOrganization & { adminUser: null }) ); 
        if (!mappedOrg) throw new Error('Failed to map newly created organization.');
        return mappedOrg;
    } catch (error: any) {
        logger.error('Error registering new organization:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('contactPersonEmail')) {
            // This specific check might be redundant if the findUnique above catches it,
            // but good as a fallback from DB constraint.
            throw new Error('An organization with this contact email already exists or is pending verification.');
        }
        // Rethrow original error if it's already specific, or a generic one
        if (error.message.includes('already exists')) throw error;
        throw new Error('Could not register organization.');
    }
};