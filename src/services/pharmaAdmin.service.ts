// File: src/services/pharmaAdmin.service.ts
import prisma from '@/database/client';
import { User as PrismaUser, UserRole as PrismaUserRoleType } from '@prisma/client';
import { CreateStaffMemberDto, AuthenticatedUserResponse } from '@/interfaces/user.interface';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants';
import { createUser, findUserByEmail, mapToAuthenticatedUserResponse, mapAppRolesToPrismaRoles } from './user.service';
import { hashPassword } from '@/utils/password.util';
import logger from '@/utils/logger.utils';

// Define roles that a Pharma Admin can assign to their staff
const assignableStaffRolesByPharmaAdmin = [AppUserRoles.STAFF]; // Example: Pharmacist, Technician could be added later as specific STAFF sub-types or distinct roles

export const createPharmaStaffService = async (
    adminOrganizationId: string,
    staffData: CreateStaffMemberDto
): Promise<{ staffMember: AuthenticatedUserResponse, temporaryPassword?: string }> => {
    const { email, password, fullName, role, employeeId, department } = staffData;

    if (!assignableStaffRolesByPharmaAdmin.includes(role)) {
        throw new Error(`Pharma Admin is not authorized to assign the role: ${role}. Allowed: ${assignableStaffRolesByPharmaAdmin.join(', ')}`);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    let tempPassword = password;
    if (!tempPassword) {
        tempPassword = Math.random().toString(36).slice(-10) + 'Pa1!'; // Pharmacy-specific temp pass prefix
    }
    const hashedPassword = await hashPassword(tempPassword);

    const newStaffUser = await createUser({
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        roles: [role, AppUserRoles.PATIENT], // Staff can also be patients
        staffOrganizationId: adminOrganizationId,
        employeeId,
        department,
    });

    const staffResponse = mapToAuthenticatedUserResponse(newStaffUser as any);
    if (!staffResponse) {
        throw new Error('Failed to map created staff member for response.');
    }

    return { staffMember: staffResponse, temporaryPassword: password ? undefined : tempPassword };
};

export const listPharmaStaffService = async (
    organizationId: string,
    page: number,
    limit: number
): Promise<{ staff: AuthenticatedUserResponse[], total: number, page: number, limit: number }> => {
    const skip = (page - 1) * limit;
    const take = limit;

    const staffMembers = await prisma.user.findMany({
        where: {
            staffOrganizationId: organizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByPharmaAdmin) } // Ensure we only list relevant staff roles
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
    });

    const totalStaff = await prisma.user.count({
        where: { 
            staffOrganizationId: organizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByPharmaAdmin) }
        },
    });

    return {
        staff: staffMembers.map(staff => mapToAuthenticatedUserResponse(staff as any)).filter(s => s !== null) as AuthenticatedUserResponse[],
        total: totalStaff,
        page,
        limit,
    };
};

export const getPharmaStaffByIdService = async (
    staffUserId: string,
    adminOrganizationId: string
): Promise<AuthenticatedUserResponse | null> => {
    const staffMember = await prisma.user.findFirst({
        where: {
            id: staffUserId,
            staffOrganizationId: adminOrganizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByPharmaAdmin) }
        },
    });
    return mapToAuthenticatedUserResponse(staffMember as any);
};

export const updatePharmaStaffStatusService = async (
    staffUserId: string,
    adminOrganizationId: string,
    isActive: boolean
): Promise<AuthenticatedUserResponse | null> => {
    const staffMember = await prisma.user.findFirst({
        where: {
            id: staffUserId,
            staffOrganizationId: adminOrganizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByPharmaAdmin) }
        },
    });

    if (!staffMember) {
        return null; 
    }

    const updatedStaff = await prisma.user.update({
        where: { id: staffUserId },
        data: { isActive },
    });
    return mapToAuthenticatedUserResponse(updatedStaff as any);
};