import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import { generateAccessToken } from '@/utils/jwt.utils';
import { verifyRefreshToken } from '@/utils/jwt.utils';
import { AuthenticatedUser } from '@/interfaces/user.interface';
import * as passwordResetService from '@/services/passwordReset.service';
import { sendPasswordResetEmail } from '@/services/email.service';
import { mapToAuthenticatedUserResponse } from '@/services/user.service'; // For consistent responses
import { ForgotPasswordRequestDto, ResetPasswordDto } from '@/interfaces/user.interface';
import logger from '@/utils/logger.utils';

/**
 * Handles user registration.
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.registerUserService(req.body);
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'User registered successfully. Please verify your email if required.',
      data: { user },
    });
    return; 
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUserService(email, password);
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Login successful.',
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
    return; 
  } catch (error) {
    next(error);
  }
};

/**
 * Handles refreshing an access token.
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
        res.status(StatusCodes.BAD_REQUEST).json({
            status: 'error',
            message: 'Refresh token is required.',
        });
        return; 
    }

    try {
        const decoded = await verifyRefreshToken(providedRefreshToken);
        const user = await userService.findUserById(decoded.id); 

        if (!user || !user.is_active) {
            logger.warn(`Refresh token attempt for invalid or inactive user ID: ${decoded.id}`);
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                message: 'Invalid refresh token or user not found/active.',
            });
            return; 
        }
        
        const authenticatedUserPayload: AuthenticatedUser = {
            id: user.id,
            email: user.email,
            roles: user.roles,
          };

        const newAccessToken = generateAccessToken(authenticatedUserPayload);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Access token refreshed successfully.',
            data: {
                accessToken: newAccessToken,
            },
        });
        return; 
    } catch (error) {
        logger.error('Error refreshing token:', error);
        if (error instanceof Error && (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError')) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                message: 'Refresh token is invalid or expired. Please log in again.',
            });
            return; 
        }
        next(error);
    }
};

/**
 * Example protected route controller.
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'error',
                message: 'User not authenticated.',
            });
            return; 
        }
        const userProfile = await userService.findUserById(req.user.id);
        if (!userProfile) {
             res.status(StatusCodes.NOT_FOUND).json({
                status: 'error',
                message: 'User profile not found.',
            });
            return; 
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_hash, ...profileData } = userProfile;

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Profile fetched successfully.',
            data: { user: profileData },
        });
        return; 
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body as ForgotPasswordRequestDto;

  try {
    const { plainToken, user } = await passwordResetService.createAndSaveResetToken(email);

    // Option 1: Fire and forget with local error logging (as originally structured)
    // sendPasswordResetEmail(user.email, plainToken, user.full_name)
    //   .catch(emailError => {
    //     logger.error(`CRITICAL: Failed to send password reset email to ${user.email} (User ID: ${user.id}): ${emailError.message}`);
    //   });

    // Option 2: Await email sending and let errors propagate to the main catch block (more robust for critical emails)
    try {
      await sendPasswordResetEmail(user.email, plainToken, user.full_name);
    } catch (emailError: any) {
      logger.error(`CRITICAL: Failed to send password reset email to ${user.email} (User ID: ${user.id}): ${emailError.message}`);
      // Decide if this failure should prevent the "success" message to the user
      // For now, we'll let the generic success message below be sent, but this is a critical internal error.
      // If email is absolutely mandatory for this flow to be considered "successful" from API PoV,
      // you might throw a new error here or call next(emailError).
    }

    res.status(200).json({
      status: 'success',
      message: 'If your email address is registered, you will receive a password reset link shortly.',
    });
    // No explicit 'return;' needed here as it's the end of the try block's successful path.
    // The function will implicitly return undefined.

  } catch (error: any) {
    // This catch handles errors from createAndSaveResetToken or potentially re-thrown from sendPasswordResetEmail
    if (error.message.startsWith('If your email address exists') || 
        error.message.startsWith('Your account is not active')) {
      // ---- The Fix Applied ----
      res.status(200).json({ // Send the specific "masking" success response
        status: 'success', 
        message: error.message,
      });
      return; // Explicitly return here to make it Promise<void> compliant for this path
      // -------------------------
    }
    // For other generic errors (e.g., database down, unexpected issues from services)
    next(error); 
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { token, newPassword } = req.body as ResetPasswordDto;

  try {
    const updatedUser = await passwordResetService.verifyAndProcessPasswordReset(token, newPassword);
    // Optionally send a password change confirmation email here
    // if (updatedUser.email) { // Check if email exists before trying to use it
    //   await sendPasswordChangeConfirmationEmail(updatedUser.email, updatedUser.fullName || 'User');
    // }

    // This line is fine as it doesn't use 'return' before res.json()
    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully.',
      data: {
        user: mapToAuthenticatedUserResponse(updatedUser),
      },
    });
  } catch (error: any) {
    // Handle specific errors from the service (e.g., invalid token, expired)
    if (error.message.includes('token') || error.message.includes('account is not active')) {
      // ---- The Fix ----
      res.status(400).json({ // Remove 'return' from this line
        status: 'error',
        message: error.message,
      });
      return; // Add an explicit 'return;' to exit the function here, fulfilling the void promise for this path.
      // -----------------
    }
    // If the error wasn't handled above, pass it to the next error-handling middleware
    next(error);
  }
};