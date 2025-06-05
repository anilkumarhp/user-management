import prisma from '@/database/client';
import { Prisma, User as PrismaUserFromGenerated, UserRole as PrismaUserRoleType } from '@prisma/client';
import { User, CreateUserDto, AuthenticatedUserResponse, UserUpdateDto } from '@/interfaces/user.interface';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants';
import { hashPassword } from '@/utils/password.util';
import logger from '@/utils/logger.utils';

// Helper to map Prisma UserRole to your app's UserRoles enum
export const mapPrismaRolesToAppRoles = (prismaRoles: PrismaUserRoleType[]): AppUserRoles[] => {
  return prismaRoles.map(role => {
    const appRole = AppUserRoles[role as keyof typeof AppUserRoles];
    if (!appRole) {
        logger.warn(`Unmapped Prisma role found during mapping: ${role}`);
        return null;
    }
    return appRole;
  }).filter(role => role !== null) as AppUserRoles[];
};

// Helper to map your app's UserRoles enum to Prisma UserRole
export const mapAppRolesToPrismaRoles = (appRoles: AppUserRoles[]): PrismaUserRoleType[] => {
  return appRoles.map(role => {
    const prismaRole = PrismaUserRoleType[role as keyof typeof PrismaUserRoleType];
    if(!prismaRole) {
        logger.warn(`Unmapped App role found during mapping: ${role}`);
        throw new Error(`Invalid application role: ${role} cannot be mapped to a database role.`);
    }
    return prismaRole;
    });
};

// Helper to map PrismaUser to your application's User interface (includes password_hash)
export const mapToUserInterface = (prismaUser: PrismaUserFromGenerated | null): User | null => {
  if (!prismaUser) return null;
  return {
    id: prismaUser.id,
    email: prismaUser.email.toLowerCase(),
    password_hash: prismaUser.passwordHash,
    full_name: prismaUser.fullName || undefined,
    roles: mapPrismaRolesToAppRoles(prismaUser.roles),
    mobile_code: prismaUser.mobileCode || "",
    mobile: prismaUser.mobile || 0,
    phone_code: prismaUser.phoneCode,
    phone: prismaUser.phone,
    address: prismaUser.address || "",
    pin_code: prismaUser.pinCode || "",
    is_active: prismaUser.isActive,
    is_email_verified: prismaUser.isEmailVerified,
    created_at: prismaUser.createdAt,
    updated_at: prismaUser.updatedAt,
    organizationId: prismaUser.organizationId,
    staffOrganizationId: prismaUser.staffOrganizationId,
    employeeId: prismaUser.employeeId,
    department: prismaUser.department,
  };
};

// Helper to map PrismaUser to AuthenticatedUserResponse (for API responses, no password_hash)
export const mapToAuthenticatedUserResponse = (prismaUser: PrismaUserFromGenerated | null): AuthenticatedUserResponse | null => {
    if (!prismaUser) return null;
    return {
      id: prismaUser.id,
      email: prismaUser.email.toLowerCase(),
      full_name: prismaUser.fullName || undefined,
      roles: mapPrismaRolesToAppRoles(prismaUser.roles),
      is_active: prismaUser.isActive,
      is_email_verified: prismaUser.isEmailVerified,
      created_at: prismaUser.createdAt.toISOString(),
      updated_at: prismaUser.updatedAt.toISOString(),
      organizationId: prismaUser.organizationId,
      staffOrganizationId: prismaUser.staffOrganizationId, // Added for consistency
      employeeId: prismaUser.employeeId,
      department: prismaUser.department,
    };
  };


export const findUserByEmail = async (email: string): Promise<User | null> => {
  const normalizedEmail = email.toLowerCase();
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    return mapToUserInterface(prismaUser);
  } catch (error) {
    logger.error(`Error finding user by email ${normalizedEmail}:`, error);
    throw new Error('Could not retrieve user by email.');
  }
};

export const findUserById = async (id: string): Promise<User | null> => {
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { id },
    });
    return mapToUserInterface(prismaUser);
  } catch (error) {
    logger.error(`Error finding user by ID ${id}:`, error);
    throw new Error('Could not retrieve user by ID.');
  }
};

export const createUser = async (userData: CreateUserDto): Promise<User> => {
  const {
    email,
    password_hash,
    full_name,
    roles,
    mobile_code,
    mobile,
    address,
    pin_code,
    organizationId,
    staffOrganizationId, // Destructure new fields
    employeeId,
    department
} = userData;
  const normalizedEmail = email.toLowerCase();

  try {
    const prismaUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: password_hash,
        fullName: full_name || null,
        roles: mapAppRolesToPrismaRoles(roles && roles.length > 0 ? roles : [AppUserRoles.PATIENT]),
        mobileCode: mobile_code ?? null, // Consistent handling for optional String?
        mobile: mobile ?? null,          // Corrected line: use ?? null
        address: address ?? null,        // Consistent handling for optional String?
        pinCode: pin_code ?? null,       // Consistent handling for optional String?
        isActive: true,
        isEmailVerified: false,
        organizationId: organizationId || null,
        staffOrganizationId: staffOrganizationId || null,
        employeeId: employeeId || null,
        department: department || null,
      },
    });
    const mappedUser = mapToUserInterface(prismaUser);
    if (!mappedUser) {
        throw new Error('Failed to map created user.');
    }
    return mappedUser;
  } catch (error: any) {
    logger.error('Error creating user:', { message: error.message, code: error.code, meta: error.meta });
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      throw new Error('User with this email already exists.');
    }
    throw new Error('Could not create user.');
  }
};


/**
 * Updates a user's information.
 * Only fields provided in userData will be updated.
 * To clear a nullable field, provide `null` as its value in userData.
 */
export const updateUser = async (id: string, userData: UserUpdateDto): Promise<User | null> => {
  const dataToUpdate: Prisma.UserUpdateInput = {};

  if (userData.email !== undefined) {
    dataToUpdate.email = userData.email.toLowerCase();
  }
  if (userData.fullName !== undefined) {
    dataToUpdate.fullName = userData.fullName; // Allows setting to null or a new string
  }
  if (userData.roles !== undefined) {
    dataToUpdate.roles = mapAppRolesToPrismaRoles(userData.roles);
  }
  if (userData.mobileCode !== undefined) {
    dataToUpdate.mobileCode = userData.mobileCode;
  }
  if (userData.mobile !== undefined) {
    dataToUpdate.mobile = userData.mobile;
  }
  if (userData.phoneCode !== undefined) {
    dataToUpdate.phoneCode = userData.phoneCode;
  }
  if (userData.phone !== undefined) {
    dataToUpdate.phone = userData.phone;
  }
  if (userData.address !== undefined) {
    dataToUpdate.address = userData.address;
  }
  if (userData.pinCode !== undefined) {
    dataToUpdate.pinCode = userData.pinCode;
  }
  if (userData.isActive !== undefined) {
    dataToUpdate.isActive = userData.isActive;
  }
  if (userData.employeeId !== undefined) {
    dataToUpdate.employeeId = userData.employeeId;
  }
  if (userData.department !== undefined) {
    dataToUpdate.department = userData.department;
  }

  // Corrected logic for updating organizationId (via the 'organization' relation)
  if (userData.organizationId !== undefined) {
    if (userData.organizationId === null) {
      // Disconnects the user from being an admin of any organization.
      // This will set the underlying 'organizationId' foreign key field to null.
      dataToUpdate.organization = { disconnect: true };
    } else {
      // Connects the user as an admin to the specified organization.
      // This will set the underlying 'organizationId' foreign key.
      dataToUpdate.organization = { connect: { id: userData.organizationId } };
    }
  }

  // Corrected logic for updating staffOrganizationId (via the 'staffOrganization' relation)
  if (userData.staffOrganizationId !== undefined) {
    if (userData.staffOrganizationId === null) {
      // Removes the user from being a staff member of the organization.
      // This will set the underlying 'staffOrganizationId' foreign key field to null.
      dataToUpdate.staffOrganization = { disconnect: true };
    } else {
      // Assigns the user as a staff member to the specified organization.
      // This will set the underlying 'staffOrganizationId' foreign key.
      dataToUpdate.staffOrganization = { connect: { id: userData.staffOrganizationId } };
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    logger.warn(`No data provided for update of user ID ${id}. Returning current user data.`);
    const currentUser = await prisma.user.findUnique({ where: { id } });
    return mapToUserInterface(currentUser);
  }

  try {
    const updatedPrismaUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
    return mapToUserInterface(updatedPrismaUser);
  } catch (error: any) {
    if (error.code === 'P2025') { // Record to update not found
      logger.warn(`User with ID ${id} not found for update.`);
      return null;
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      // Unique constraint violation, likely on 'email'
      throw new Error('User with this email already exists.');
    }
    // Check for other specific Prisma errors related to relation updates if needed
    // e.g., P2016 (related record not found for connect)
    if (error.code === 'P2016' || (error.message && error.message.includes("related record not found"))) {
        logger.error(`Error updating user relations for ID ${id}: Related record not found. Details: ${error.message}`);
        throw new Error('Could not update user due to a missing related record.');
    }
    logger.error(`Error updating user with ID ${id}:`, error);
    throw new Error('Could not update user.');
  }
};


/**
 * Deletes a user by their ID.
 */
export const deleteUser = async (id: string): Promise<User | null> => {
  try {
    const deletedPrismaUser = await prisma.user.delete({
      where: { id },
    });
    logger.info(`User with ID ${id} deleted successfully.`);
    return mapToUserInterface(deletedPrismaUser); // Returns the data of the deleted user
  } catch (error: any) {
    if (error.code === 'P2025') { // Record to delete not found (e.g., "An operation failed because it depends on one or more records that were required but not found.")
      logger.warn(`User with ID ${id} not found for deletion.`);
      return null;
    }
    // Log other errors
    logger.error(`Error deleting user with ID ${id}:`, error);
    throw new Error('Could not delete user.');
  }
};


/**
 * Changes a user's password.
 * @param userId The ID of the user.
 * @param newPassword The new plain text password.
 * @returns The updated raw Prisma User object.
 * @throws Error if user not found.
 */
export const changeUserPassword = async (userId: string, newPassword: string): Promise<PrismaUserFromGenerated> => {
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    logger.error(`Attempt to change password for non-existent user ID: ${userId}`);
    throw new Error('User not found.');
  }

  const newPasswordHash = await hashPassword(newPassword);

  const updatedPrismaUser = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return updatedPrismaUser; // Return the raw Prisma user object
};