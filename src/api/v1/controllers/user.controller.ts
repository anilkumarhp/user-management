import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as userService from '@/services/user.service';
// No need to import userService.mapToAuthenticatedUserResponse here, as adminService now returns the correct type
import { UserUpdateDto } from '@/interfaces/user.interface';

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = req.params;
        const userData = req.body as UserUpdateDto;

        const userResponse = await userService.updateUser(userId, userData)
        if (!userResponse) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'User not found to update status.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'User data updated.', data: userResponse });
        return;
    } catch (error) {
        next(error)
    }
}


export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try{
        const {userId} = req.params;

        const userResponse = await userService.deleteUser(userId)

         if (!userResponse) {
            res.status(StatusCodes.NOT_FOUND).json({ status: 'error', message: 'User not found to update status.' });
            return;
        }
        res.status(StatusCodes.OK).json({ status: 'success', message: 'User deleted successfully.'});
        return;
    }catch (error) {
        next(error)
    }
}