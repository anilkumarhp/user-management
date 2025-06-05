import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms'; // Explicitly import StringValue type from 'ms'
import config from '@/config';
import { AuthenticatedUser } from '@/interfaces/user.interface';

/**
 * Generates an access token.
 * @param user - The user object (id, email, roles).
 * @returns The generated JWT access token.
 */
export const generateAccessToken = (user: AuthenticatedUser): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.accessTokenExpiresIn as StringValue // Assert to StringValue
  };
  return jwt.sign(
    { id: user.id, email: user.email, roles: user.roles, organizationId: user.organizationId },
    config.jwt.secret,
    options
  );
};

/**
 * Generates a refresh token.
 * @param user - The user object (id, email).
 * @returns The generated JWT refresh token.
 */
export const generateRefreshToken = (user: Pick<AuthenticatedUser, 'id' | 'email'>): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshTokenExpiresIn as StringValue // Assert to StringValue
  };
  return jwt.sign(
    { id: user.id, email: user.email }, // Refresh token might have fewer claims
    config.jwt.refreshTokenSecret,
    options
  );
};

/**
 * Verifies an access token.
 * @param token - The JWT access token to verify.
 * @returns A promise that resolves to the decoded token payload if valid.
 */
export const verifyAccessToken = (token: string): Promise<AuthenticatedUser> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded as AuthenticatedUser);
    });
  });
};

/**
 * Verifies a refresh token.
 * @param token - The JWT refresh token to verify.
 * @returns A promise that resolves to the decoded token payload if valid.
 */
export const verifyRefreshToken = (token: string): Promise<Pick<AuthenticatedUser, 'id' | 'email'>> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.refreshTokenSecret, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded as Pick<AuthenticatedUser, 'id' | 'email'>);
    });
  });
};