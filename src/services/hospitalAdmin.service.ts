import prisma from '@/database/client';
import { User as PrismaUser, UserRole as PrismaUserRoleType } from '@prisma/client';
import { CreateStaffMemberDto, AuthenticatedUserResponse, User } from '@/interfaces/user.interface';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants';
import { createUser, findUserByEmail, mapToAuthenticatedUserResponse, mapAppRolesToPrismaRoles } from './user.service';
import { hashPassword } from '@/utils/password.util';
import logger from '@/utils/logger.utils';

const assignableStaffRolesByHospitalAdmin = [AppUserRoles.DOCTOR, AppUserRoles.NURSE, AppUserRoles.STAFF];

export const createStaffMemberService = async (
    adminOrganizationId: string,
    staffData: CreateStaffMemberDto
): Promise<{ staffMember: AuthenticatedUserResponse, temporaryPassword?: string }> => {
    const { email, password, fullName, role, employeeId, department } = staffData;

    if (!assignableStaffRolesByHospitalAdmin.includes(role)) {
        throw new Error(`Hospital Admin is not authorized to assign the role: ${role}`);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    let tempPassword = password;
    if (!tempPassword) {
        // Generate a more secure random password
        tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!'; 
    }
    const hashedPassword = await hashPassword(tempPassword);

    const newStaffUser = await createUser({
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        roles: [role, AppUserRoles.PATIENT], // Staff are also patients by default
        staffOrganizationId: adminOrganizationId, // Link staff to the admin's organization
        employeeId,
        department,
    });

    const staffResponse = mapToAuthenticatedUserResponse(newStaffUser as any); // Cast needed if map expects PrismaUser
     if (!staffResponse) {
        throw new Error('Failed to map created staff member for response.');
    }

    return { staffMember: staffResponse, temporaryPassword: password ? undefined : tempPassword };
};

export const listStaffByOrganizationService = async (
    organizationId: string,
    page: number,
    limit: number
): Promise<{ staff: AuthenticatedUserResponse[], total: number, page: number, limit: number }> => {
    const skip = (page - 1) * limit;
    const take = limit;

    const staffMembers = await prisma.user.findMany({
        where: {
            staffOrganizationId: organizationId,
            // Optionally filter out HOSPITAL_ADMIN if they shouldn't appear in "staff" list
            // roles: { hasSome: mapAppRolesToPrismaRoles(assignableStaffRolesByHospitalAdmin) } 
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
    });

    const totalStaff = await prisma.user.count({
        where: { staffOrganizationId: organizationId },
    });

    return {
        staff: staffMembers.map(staff => mapToAuthenticatedUserResponse(staff as any)).filter(s => s !== null) as AuthenticatedUserResponse[],
        total: totalStaff,
        page,
        limit,
    };
};

export const getStaffMemberByIdService = async (
    staffUserId: string,
    adminOrganizationId: string
): Promise<AuthenticatedUserResponse | null> => {
    const staffMember = await prisma.user.findFirst({
        where: {
            id: staffUserId,
            staffOrganizationId: adminOrganizationId, // Ensure staff belongs to the admin's organization
        },
    });
    return mapToAuthenticatedUserResponse(staffMember as any);
};

export const updateStaffMemberStatusService = async (
    staffUserId: string,
    adminOrganizationId: string,
    isActive: boolean
): Promise<AuthenticatedUserResponse | null> => {
    // First, verify the staff member belongs to the admin's organization
    const staffMember = await prisma.user.findFirst({
        where: {
            id: staffUserId,
            staffOrganizationId: adminOrganizationId,
        },
    });

    if (!staffMember) {
        return null; // Or throw a "not found in this organization" error
    }

    const updatedStaff = await prisma.user.update({
        where: { id: staffUserId },
        data: { isActive },
    });
    return mapToAuthenticatedUserResponse(updatedStaff as any);
};