// src/services/passwordReset.service.ts
import prisma from '@/database/client';
import { PasswordResetToken, User as PrismaUserFromGenerated } from '@prisma/client'; // Use PrismaUserFromGenerated for return type
// AppUserInterface is still used by createAndSaveResetToken's return if needed elsewhere
import { User as AppUserInterface } from '@/interfaces/user.interface';
import { generateSecureToken, hashToken } from '@/utils/emailToken.utils';
import { findUserByEmail, changeUserPassword } from '@/services/user.service';
import logger from '@/utils/logger.utils';

// createAndSaveResetToken can still return AppUserInterface if that's what sendPasswordResetEmail needs
export const createAndSaveResetToken = async (email: string): Promise<{ plainToken: string, user: AppUserInterface }> => {
  const user = await findUserByEmail(email); // Returns AppUserInterface
  // ... (rest of the function remains the same)
  if (!user) {
    logger.warn(`Password reset attempt for non-existent email: ${email}`);
    throw new Error('If your email address exists in our system, you will receive a password reset link.');
  }
   if (!user.is_active) {
    logger.warn(`Password reset attempt for inactive user: ${email} (ID: ${user.id})`);
    throw new Error('Your account is not active. Please contact support.');
  }
  // ... (token generation and saving logic) ...
  const plainToken = generateSecureToken(parseInt(process.env.PASSWORD_RESET_TOKEN_LENGTH_BYTES || '32', 10));
  const tokenHash = hashToken(plainToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN_HOURS || '1', 10));

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { expiresAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });
  return { plainToken, user };
};


/**
 * Verifies a password reset token and updates the user's password.
 * @param plainToken The plain reset token from the client.
 * @param newPassword The new password to set.
 * @returns The updated raw Prisma User object.
 * @throws Error if token is invalid, expired, used, or user not found.
 */
export const verifyAndProcessPasswordReset = async (plainToken: string, newPassword: string): Promise<PrismaUserFromGenerated> => {
  const tokenHash = hashToken(plainToken);

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }, // user here is PrismaUserFromGenerated
  });

  if (!tokenRecord) {
    throw new Error('Invalid or expired password reset token.');
  }
  if (tokenRecord.usedAt) {
    throw new Error('This password reset token has already been used.');
  }
  if (new Date() > tokenRecord.expiresAt) {
    throw new Error('This password reset token has expired.');
  }
  if (!tokenRecord.user) {
    logger.error(`PasswordResetToken ${tokenRecord.id} has no associated user.`);
    throw new Error('Invalid token: user not found.');
  }
  if (!tokenRecord.user.isActive) {
    throw new Error('Your account is not active. Please contact support.');
  }

  // changeUserPassword now returns PrismaUserFromGenerated
  const updatedPrismaUser = await changeUserPassword(tokenRecord.userId, newPassword);

  await prisma.passwordResetToken.update({
    where: { id: tokenRecord.id },
    data: { usedAt: new Date() },
  });

  return updatedPrismaUser; // Return the raw Prisma user object
};