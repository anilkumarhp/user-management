import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as adminService from '@/services/admin.service';
// No need to import userService.mapToAuthenticatedUserResponse here, as adminService now returns the correct type
import { AdminUpdateUserRolesDto, AdminUpdateUserStatusDto } from '@/interfaces/user.interface';
import logger from '@/utils/logger.utils';

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string || '1', 10);
        const limit = parseInt(req.query.limit as string || '10', 10);
        // adminService.getAllUsersService already returns AuthenticatedUserResponse[]
        const { users, total, page: resultPage, limit: resultLimit } = await adminService.getAllUsersService(page, limit);
        
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Users fetched successfully.',
            data: users, // Directly use users from service
            meta: {
                total,
                page: resultPage,
                limit: resultLimit,
                totalPages: Math.ceil(total / resultLimit)
            }
        });
        return;
    } catch (error) {
        next(error);
    }
};

export const getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        // adminService.getUserByIdService already returns AuthenticatedUserResponse
        const userResponse = await adminService.getUserByIdService(userId);
        if (!userResponse) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'User not found.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: userResponse });
        return;
    } catch (error) {
        next(error);
    }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        const statusData = req.body as AdminUpdateUserStatusDto;
        // adminService.updateUserStatusService already returns AuthenticatedUserResponse
        const userResponse = await adminService.updateUserStatusService(userId, statusData);
        if (!userResponse) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'User not found to update status.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'User status updated.', data: userResponse });
        return;
    } catch (error) {
        next(error);
    }
};

export const updateUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        const rolesData = req.body as AdminUpdateUserRolesDto;
        
        // adminService.updateUserRolesService already returns AuthenticatedUserResponse
        const userResponse = await adminService.updateUserRolesService(userId, rolesData);
        if (!userResponse) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'User not found to update roles.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'User roles updated.', data: userResponse });
        return;
    } catch (error) {
        next(error);
    }
};

// Organization Management Controllers
export const listPendingOrganizations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string || '1', 10);
        const limit = parseInt(req.query.limit as string || '10', 10);
        const result = await adminService.getPendingOrganizationsService(page, limit);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Pending organizations fetched successfully.',
            data: result.organizations,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: Math.ceil(result.total / result.limit)
            }
        });
        return;
    } catch (error) {
        next(error);
    }
};

export const approveOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { orgId } = req.params;
        const systemAdminId = req.user!.id; // Authenticated system admin
        const organization = await adminService.approveOrganizationService(orgId, systemAdminId);
        if (!organization) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Organization not found or not pending approval.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'Organization approved successfully.', data: organization });
        return;
    } catch (error) {
        next(error);
    }
};

export const rejectOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { orgId } = req.params;
        const { rejectionReason } = req.body;
        const systemAdminId = req.user!.id; // Authenticated system admin
        const organization = await adminService.rejectOrganizationService(orgId, systemAdminId, rejectionReason);
         if (!organization) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Organization not found or not pending approval.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'Organization rejected.', data: organization });
        return;
    } catch (error) {
        next(error);
    }
};