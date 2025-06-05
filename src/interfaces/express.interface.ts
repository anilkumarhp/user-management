// This file is intended to augment the global Express namespace.
// It should not have top-level imports of 'express' itself if it's primarily for global augmentation.
import { AuthenticatedUser } from './user.interface';

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser; // User property will hold id, email, roles
    }
  }
}