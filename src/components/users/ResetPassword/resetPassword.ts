import User, { ResetToken } from '../model';
import { Request, Response } from 'express';
import {
    AppError,
    errorHandler,
    HttpCode
} from '../../../library/errorHandler';
import bcrypt from 'bcrypt';
import sendEmail from '../sendEmails';

const resetPassword = async (
    userId: string,
    token: string,
    password: string,
    res: Response
) => {
    try {
        let passwordResetToken = await ResetToken.findOne({ userId });
    if (!passwordResetToken) {
        const appError = new AppError({
            httpCode: HttpCode.NOT_FOUND,
            description: 'Could not find reset token'
        });
        errorHandler.handleError(appError, res);
        return;
    } else {
        const isValid = await bcrypt.compare(token, passwordResetToken.token);
        if (!isValid) {
            const appError = new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Not a valid token'
            });
            errorHandler.handleError(appError, res);
        }
        const hash = await bcrypt.hash(password, 10);
        await User.updateOne({ _id: userId }, { password: hash });
        const user = await User.findById({ _id: userId });
        if (user) {
            sendEmail(
                user.email,
                'Password Reset Successful',
                {
                    name: user?.firstName
                },
                './resetPassword.handlebars'
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
        const criticalError = new Error('Critical Error - Error reseting password');
        errorHandler.handleError(criticalError);
    }
};

export default resetPassword;
