import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as organizationService from '@/services/organization.service';
import { CreateOrganizationDto } from '@/interfaces/organization.interface';
import logger from '@/utils/logger.utils';

export const registerOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const orgData = req.body as CreateOrganizationDto;
        const organization = await organizationService.registerNewOrganizationService(orgData);
        res.status(StatusCodes.CREATED).json({
            status: 'success',
            message: 'Organization registration submitted successfully. Pending verification.',
            data: organization,
        });
        return;
    } catch (error: any) {
        if (error.message.includes('already exists')) { // More specific error handling
            error.statusCode = StatusCodes.CONFLICT;
        }
        next(error);
    }
};