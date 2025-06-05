import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as hospitalAdminService from '@/services/hospitalAdmin.service';
import { CreateStaffMemberDto } from '@/interfaces/user.interface';
import logger from '@/utils/logger.utils';

export const createStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const hospitalAdmin = req.user;
        if (!hospitalAdmin || !hospitalAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Hospital Admin not associated with an organization.' });
            return;
        }

        const staffData = req.body as CreateStaffMemberDto;
        const { staffMember, temporaryPassword } = await hospitalAdminService.createStaffMemberService(
            hospitalAdmin.organizationId,
            staffData
        );
        
        // In a real app, this temporary password should be sent securely (e.g., email) or an invite flow used.
        // For development, logging it is acceptable.
        logger.info(`Temporary password for new staff ${staffMember.email}: ${temporaryPassword}`);

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: 'Staff member created successfully. Temporary password logged for development.',
            data: staffMember
        });
        return;
    } catch (error: any) {
        if (error.message.includes('already exists')) {
            error.statusCode = StatusCodes.CONFLICT;
        } else if (error.message.includes('not authorized') || error.message.includes('Invalid role')) {
            error.statusCode = StatusCodes.FORBIDDEN;
        }
        next(error);
    }
};

export const listStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const hospitalAdmin = req.user;
        if (!hospitalAdmin || !hospitalAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Hospital Admin not associated with an organization.' });
            return;
        }

        const page = parseInt(req.query.page as string || '1', 10);
        const limit = parseInt(req.query.limit as string || '10', 10);

        const result = await hospitalAdminService.listStaffByOrganizationService(hospitalAdmin.organizationId, page, limit);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Staff members fetched successfully.',
            data: result.staff,
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

export const getStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const hospitalAdmin = req.user;
        if (!hospitalAdmin || !hospitalAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Hospital Admin not associated with an organization.' });
            return;
        }
        const { staffUserId } = req.params;
        const staffMember = await hospitalAdminService.getStaffMemberByIdService(staffUserId, hospitalAdmin.organizationId);

        if (!staffMember) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Staff member not found or does not belong to this organization.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: staffMember });
        return;
    } catch (error) {
        next(error);
    }
};

export const updateStaffStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const hospitalAdmin = req.user;
        if (!hospitalAdmin || !hospitalAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Hospital Admin not associated with an organization.' });
            return;
        }
        const { staffUserId } = req.params;
        const { isActive } = req.body;

        const updatedStaff = await hospitalAdminService.updateStaffMemberStatusService(staffUserId, hospitalAdmin.organizationId, isActive);
        if (!updatedStaff) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Staff member not found or does not belong to this organization.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'Staff member status updated.', data: updatedStaff });
        return;
    } catch (error) {
        next(error);
    }
};