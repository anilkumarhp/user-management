// File: src/services/labAdmin.service.ts
import prisma from '@/database/client';
import { User as PrismaUser, UserRole as PrismaUserRoleType } from '@prisma/client';
import { CreateStaffMemberDto, AuthenticatedUserResponse } from '@/interfaces/user.interface';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants';
import { createUser, findUserByEmail, mapToAuthenticatedUserResponse, mapAppRolesToPrismaRoles } from './user.service';
import { hashPassword } from '@/utils/password.util';
import logger from '@/utils/logger.utils';

const assignableStaffRolesByLabAdmin = [AppUserRoles.STAFF]; // Example: Lab Technician, Pathologist could be specific STAFF types

export const createLabStaffService = async (
    adminOrganizationId: string,
    staffData: CreateStaffMemberDto
): Promise<{ staffMember: AuthenticatedUserResponse, temporaryPassword?: string }> => {
    const { email, password, fullName, role, employeeId, department } = staffData;

    if (!assignableStaffRolesByLabAdmin.includes(role)) {
        throw new Error(`Lab Admin is not authorized to assign the role: ${role}. Allowed: ${assignableStaffRolesByLabAdmin.join(', ')}`);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    let tempPassword = password;
    if (!tempPassword) {
        tempPassword = Math.random().toString(36).slice(-10) + 'La1!'; // Lab-specific temp pass prefix
    }
    const hashedPassword = await hashPassword(tempPassword);

    const newStaffUser = await createUser({
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        roles: [role, AppUserRoles.PATIENT],
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

export const listLabStaffService = async (
    organizationId: string,
    page: number,
    limit: number
): Promise<{ staff: AuthenticatedUserResponse[], total: number, page: number, limit: number }> => {
    const skip = (page - 1) * limit;
    const take = limit;

    const staffMembers = await prisma.user.findMany({
        where: {
            staffOrganizationId: organizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByLabAdmin) }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
    });
    const totalStaff = await prisma.user.count({
        where: { 
            staffOrganizationId: organizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByLabAdmin) }
        },
    });

    return {
        staff: staffMembers.map(staff => mapToAuthenticatedUserResponse(staff as any)).filter(s => s !== null) as AuthenticatedUserResponse[],
        total: totalStaff,
        page,
        limit,
    };
};

export const getLabStaffByIdService = async (
    staffUserId: string,
    adminOrganizationId: string
): Promise<AuthenticatedUserResponse | null> => {
    const staffMember = await prisma.user.findFirst({
        where: {
            id: staffUserId,
            staffOrganizationId: adminOrganizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByLabAdmin) }
        },
    });
    return mapToAuthenticatedUserResponse(staffMember as any);
};

export const updateLabStaffStatusService = async (
    staffUserId: string,
    adminOrganizationId: string,
    isActive: boolean
): Promise<AuthenticatedUserResponse | null> => {
    const staffMember = await prisma.user.findFirst({
        where: {
            id: staffUserId,
            staffOrganizationId: adminOrganizationId,
            roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByLabAdmin) }
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