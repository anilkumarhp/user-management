import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token.
 * @param length The number of bytes to generate, resulting in a hex string twice as long.
 * @returns A hex-encoded secure token.
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hashes a token using SHA256. Used for storing reset tokens securely.
 * @param token The plain token.
 * @returns The SHA256 hashed token.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};