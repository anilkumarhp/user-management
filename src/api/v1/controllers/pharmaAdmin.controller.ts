// File: src/api/v1/controllers/pharmaAdmin.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as pharmaAdminService from '@/services/pharmaAdmin.service'; // Assuming service exports
import { CreateStaffMemberDto } from '@/interfaces/user.interface'; // Assuming DTO location
import logger from '@/utils/logger.utils';

/**
 * Controller to create a new pharmacy staff member.
 */
export const createPharmaStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const staffData: CreateStaffMemberDto = req.body;
        // Assuming admin's organization ID is available from an authenticated user object
        // This might be attached by your `authenticateToken` middleware
        const adminUser = req.user  // Cast to your authenticated user type
        if (!adminUser || !adminUser.organizationId) {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin organization ID not found or user not authorized.' });
            return;
        }
        const adminOrganizationId = adminUser.organizationId;

        logger.info(`Creating pharma staff for organization ${adminOrganizationId} with email ${staffData.email}`);

        const { staffMember, temporaryPassword } = await pharmaAdminService.createPharmaStaffService(
            adminOrganizationId,
            staffData
        );

        const responseData: any = { staffMember };
        if (temporaryPassword) {
            responseData.temporaryPassword = temporaryPassword;
        }

        res.status(201).json({
            status: 'success',
            message: 'Pharmacy staff member created successfully.',
            data: responseData
        });
    } catch (error) {
        logger.error('Error in createPharmaStaff controller:', error);
        next(error); // Pass error to global error handler
    }
};

/**
 * Controller to list staff members of a pharmacy.
 */
export const listPharmaStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const adminUser = req.user;
        if (!adminUser || !adminUser.organizationId) {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin organization ID not found or user not authorized.' });
            return;
        }
        const organizationId = adminUser.organizationId;

        // Extract and validate pagination parameters from query
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;

        logger.info(`Listing pharma staff for organization ${organizationId}, page: ${page}, limit: ${limit}`);

        const result = await pharmaAdminService.listPharmaStaffService(organizationId, page, limit);

        res.status(200).json({
            status: 'success',
            message: 'Pharmacy staff members fetched successfully.',
            data: result.staff,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: Math.ceil(result.total / result.limit)
            }
        });
    } catch (error) {
        logger.error('Error in listPharmaStaff controller:', error);
        next(error);
    }
};

/**
 * Controller to get details of a specific pharmacy staff member.
 * The route file calls this `getPharmaStaffMember`.
 */
export const getPharmaStaffMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const adminUser = req.user;
        if (!adminUser || !adminUser.organizationId) {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin organization ID not found or user not authorized.' });
            return;
        }
        const adminOrganizationId = adminUser.organizationId;
        const { staffUserId } = req.params;

        if (!staffUserId) {
             res.status(400).json({ status: 'error', message: 'Staff User ID is required.' });
             return;
        }

        logger.info(`Getting pharma staff member ${staffUserId} for organization ${adminOrganizationId}`);

        const staffMember = await pharmaAdminService.getPharmaStaffByIdService(staffUserId, adminOrganizationId);

        if (!staffMember) {
            res.status(404).json({ status: 'error', message: 'Pharmacy staff member not found or not part of this organization.' });
            return;
        }

        res.status(200).json({
            status: 'success',
            data: staffMember
        });
    } catch (error) {
        logger.error('Error in getPharmaStaffMember controller:', error);
        next(error);
    }
};

/**
 * Controller to update a pharmacy staff member's account status.
 */
export const updatePharmaStaffStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const adminUser = req.user;
        if (!adminUser || !adminUser.organizationId) {
            res.status(403).json({ status: 'error', message: 'Forbidden: Admin organization ID not found or user not authorized.' });
            return;
        }
        const adminOrganizationId = adminUser.organizationId;
        const { staffUserId } = req.params;
        const { isActive } = req.body; // Assuming isActive is a boolean

        if (typeof isActive !== 'boolean') {
            res.status(400).json({ status: 'error', message: 'Invalid "isActive" status provided. It must be true or false.' });
            return;
        }
         if (!staffUserId) {
             res.status(400).json({ status: 'error', message: 'Staff User ID is required.' });
             return;
        }

        logger.info(`Updating pharma staff member ${staffUserId} status to ${isActive} for organization ${adminOrganizationId}`);

        const updatedStaffMember = await pharmaAdminService.updatePharmaStaffStatusService(
            staffUserId,
            adminOrganizationId,
            isActive
        );

        if (!updatedStaffMember) {
            res.status(404).json({ status: 'error', message: 'Pharmacy staff member not found or not part of this organization.' });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: 'Pharmacy staff member status updated.',
            data: updatedStaffMember
        });
    } catch (error) {
        logger.error('Error in updatePharmaStaffStatus controller:', error);
        next(error);
    }
};