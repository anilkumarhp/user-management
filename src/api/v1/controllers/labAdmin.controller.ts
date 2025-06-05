// File: src/api/v1/controllers/labAdmin.controller.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as labAdminService from '@/services/labAdmin.service';
import { CreateStaffMemberDto } from '@/interfaces/user.interface';
import logger from '@/utils/logger.utils';

export const createLabStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const labAdmin = req.user;
        if (!labAdmin || !labAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Lab Admin not associated with an organization.' });
            return;
        }

        const staffData = req.body as CreateStaffMemberDto;
        const { staffMember, temporaryPassword } = await labAdminService.createLabStaffService(
            labAdmin.organizationId,
            staffData
        );

        if (temporaryPassword) {
            logger.info(`Temporary password for new lab staff ${staffMember.email}: ${temporaryPassword}`);
        }

        res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: 'Lab staff member created successfully. Temporary password logged if auto-generated.',
            data: staffMember
        });
    } catch (error: any) {
         if (error.message.includes('already exists')) {
            error.statusCode = StatusCodes.CONFLICT;
        } else if (error.message.includes('not authorized') || error.message.includes('Invalid role')) {
            error.statusCode = StatusCodes.FORBIDDEN;
        }
        next(error);
    }
};

export const listLabStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const labAdmin = req.user;
        if (!labAdmin || !labAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Lab Admin not associated with an organization.' });
            return;
        }

        const page = parseInt(req.query.page as string || '1', 10);
        const limit = parseInt(req.query.limit as string || '10', 10);

        const result = await labAdminService.listLabStaffService(labAdmin.organizationId, page, limit);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Lab staff members fetched successfully.',
            data: result.staff,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: Math.ceil(result.total / result.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getLabStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const labAdmin = req.user;
         if (!labAdmin || !labAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Lab Admin not associated with an organization.' });
            return;
        }
        const { staffUserId } = req.params;
        const staffMember = await labAdminService.getLabStaffByIdService(staffUserId, labAdmin.organizationId);

        if (!staffMember) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Lab staff member not found or does not belong to this organization.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', data: staffMember });
    } catch (error) {
        next(error);
    }
};

export const updateLabStaffStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const labAdmin = req.user;
        if (!labAdmin || !labAdmin.organizationId) {
            res.status(StatusCodes.FORBIDDEN).json({ status: 'error', message: 'Lab Admin not associated with an organization.' });
            return;
        }
        const { staffUserId } = req.params;
        const { isActive } = req.body;

        const updatedStaff = await labAdminService.updateLabStaffStatusService(staffUserId, labAdmin.organizationId, isActive);
        if (!updatedStaff) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'Lab staff member not found or does not belong to this organization.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'Lab staff member status updated.', data: updatedStaff });
    } catch (error) {
        next(error);
    }
};