import { findUserByEmail, createUser, mapToUserInterface, mapPrismaRolesToAppRoles } from './user.service';
import { hashPassword, comparePassword, generateSecureRandomToken, hashTokenForStorage} from '@/utils/password.util';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt.utils';
import { UserRoles as AppUserRoles } from '@/constants/roles.constants'; 
import { RegisterUserDto, User, AuthenticatedUser } from '@/interfaces/user.interface';
import prisma from '@/database/client';
import config from '@/config';
import logger from '@/utils/logger.utils';

export const registerUserService = async (registrationData: RegisterUserDto): Promise<Omit<User, 'password_hash'>> => {
  const { email, password, full_name } = registrationData;
  
  const existingUser = await findUserByEmail(email); 
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const hashedPassword = await hashPassword(password);

  const newUserFromService = await createUser({ 
    email: email, 
    password_hash: hashedPassword,
    full_name,
    roles: [AppUserRoles.HOSPITAL_ADMIN],
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...userWithoutPassword } = newUserFromService; // Use the mapped user from createUser
  return userWithoutPassword;
};

export const loginUserService = async (email: string, passwordPlainText: string): Promise<{ accessToken: string; refreshToken: string; user: AuthenticatedUser }> => {
  const user = await findUserByEmail(email); 
  if (!user) {
    logger.warn(`Login attempt for non-existent user: ${email.toLowerCase()}`);
    throw new Error('Invalid credentials.');
  }

  if (!user.is_active) {
    logger.warn(`Login attempt for inactive user: ${user.email}`);
    throw new Error('Account is not active.');
  }

  const passwordMatches = await comparePassword(passwordPlainText, user.password_hash);
  if (!passwordMatches) {
    logger.warn(`Failed login attempt for user: ${user.email}`);
    throw new Error('Invalid credentials.');
  }

 const authenticatedUserPayload: AuthenticatedUser = {
    id: user.id,
    email: user.email, 
    roles: user.roles, // User roles are already AppUserRoles type from mapping
    organizationId: user.organizationId // Include organizationId if present
  };

  const accessToken = generateAccessToken(authenticatedUserPayload);
  const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

  logger.info(`User logged in successfully: ${user.email}`);
  return { accessToken, refreshToken, user: authenticatedUserPayload };
};

export const requestPasswordResetService = async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user || !user.is_active) {
        // Do not reveal if user exists or is inactive for security reasons
        logger.warn(`Password reset request for non-existent or inactive user: ${normalizedEmail}`);
        // Still, pretend success to the client
        return;
    }

    const plainToken = generateSecureRandomToken();
    const tokenHash = hashTokenForStorage(plainToken);
    const expiresAt = new Date(Date.now() + config.passwordReset.tokenExpiresInMinutes * 60 * 1000);

    await prisma.passwordResetToken.create({
        data: {
            userId: user.id,
            tokenHash,
            expiresAt,
        },
    });

    // In a real application, send an email to user.email with the plainToken or a reset link
    logger.info(`Password reset token generated for ${user.email}. Token: ${plainToken} (This would be emailed)`);
    // Example: await sendPasswordResetEmail(user.email, plainToken);
};

export const resetPasswordService = async (token: string, newPasswordString: string): Promise<void> => {
    if (!token || !newPasswordString) {
        throw new Error('Token and new password are required.');
    }

    const tokenHash = hashTokenForStorage(token);

    const passwordResetTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
    });

    if (!passwordResetTokenRecord) {
        throw new Error('Invalid or expired password reset token.');
    }

    if (passwordResetTokenRecord.usedAt) {
        throw new Error('Password reset token has already been used.');
    }

    if (new Date() > passwordResetTokenRecord.expiresAt) {
        // Optionally delete expired tokens
        await prisma.passwordResetToken.delete({ where: { id: passwordResetTokenRecord.id }});
        throw new Error('Password reset token has expired.');
    }

    const newPasswordHash = await hashPassword(newPasswordString);

    await prisma.user.update({
        where: { id: passwordResetTokenRecord.userId },
        data: { passwordHash: newPasswordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
        where: { id: passwordResetTokenRecord.id },
        data: { usedAt: new Date() },
    });

    logger.info(`Password reset successfully for user ID: ${passwordResetTokenRecord.userId}`);
};