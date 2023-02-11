import User, { ResetToken } from '../model';
import { Request, Response } from 'express';
import {
    AppError,
    errorHandler,
    HttpCode
} from '../../../library/errorHandler';
import bcrypt from 'bcrypt';
import sendEmail from '../sendEmails';
import { resetPasswordTemplate } from './htmlTemplates';

interface IPasswordData {
    password: string;
    confirmPassword: string;
}

const resetPassword = async (
    userID: string,
    token: string,
    passwordData: IPasswordData,
    res: Response
) => {
    try {
        let passwordResetToken = await ResetToken.findOne({ userID });
        if (!passwordResetToken) {
            const appError = new AppError({
                httpCode: HttpCode.NOT_FOUND,
                description: 'Could not find reset token'
            });
            errorHandler.handleError(appError, res);
            return;
        } else {
            const isValid = await bcrypt.compare(
                token,
                passwordResetToken.token
            );
            if (!isValid) {
                const appError = new AppError({
                    httpCode: HttpCode.BAD_REQUEST,
                    description: 'Not a valid token'
                });
                errorHandler.handleError(appError, res);
            }
            const { password, confirmPassword } = passwordData;
            if (password !== confirmPassword) {
                const appError = new AppError({
                    httpCode: HttpCode.BAD_REQUEST,
                    description: 'Password and confirm password do not match.'
                });
                errorHandler.handleError(appError, res);
            }
            const hash = await bcrypt.hash(password, 10);
            await User.updateOne({ _id: userID }, { password: hash });
            const user = await User.findById({ _id: userID });
            const getResetPasswordTemplate = resetPasswordTemplate(
                user?.firstName
            );
            if (user) {
                sendEmail(
                    user.email,
                    'Password Reset Successful',
                    {
                        name: user?.firstName
                    },
                    getResetPasswordTemplate
                );
                await passwordResetToken.deleteOne();
                return true;
            } else {
                const appError = new AppError({
                    httpCode: HttpCode.BAD_REQUEST,
                    description: 'User does not exist'
                });
                errorHandler.handleError(appError, res);
                return;
            }
        }
    } catch (error) {
        const criticalError = new Error(
            'Critical Error - Error reseting password'
        );
        errorHandler.handleError(criticalError);
    }
};

export default resetPassword;
