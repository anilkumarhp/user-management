import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10; // Or configurable via .env

/**
 * Hashes a plain text password.
 * @param password - The plain text password.
 * @returns A promise that resolves to the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compares a plain text password with a hashed password.
 * @param plainPassword - The plain text password to compare.
 * @param hashedPassword - The hashed password from the database.
 * @returns A promise that resolves to true if passwords match, false otherwise.
 */
export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generates a secure random token.
 * @param length - The length of the byte string to generate (default 32 bytes, results in 64 hex characters).
 * @returns A secure random token in hexadecimal format.
 */
export const generateSecureRandomToken = (length = 32): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Hashes a token (e.g., password reset token) for storage.
 * This uses a simple SHA256 hash, not bcrypt, as these tokens are not passwords.
 * @param token - The plain token.
 * @returns The hashed token.
 */
export const hashTokenForStorage = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};