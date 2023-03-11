import express from 'express';
import { authorization } from '../../middleware/authorization';
import { reqValidation } from '../../middleware/reqValidation';
import {
    changePassword,
    getUser,
    updateProfile,
    updateProfileImage,
    loginUser,
    registerUser,
    forgotUserPassword,
    resetPasswordController
} from './controller';
import {
    changePasswordSchema,
    loginSchema,
    registerSchema,
    updateProfileSchema
} from './joiSchema';
import upload from '../../config/multer.config';

const userRouter = express.Router();

userRouter.post('/register', reqValidation(registerSchema), registerUser);
userRouter.post('/login', reqValidation(loginSchema), loginUser);
userRouter.post('/forgotpassword', forgotUserPassword);
userRouter.post('/passwordreset', resetPasswordController);
userRouter.post(
    '/updateProfile',
    authorization,
    reqValidation(updateProfileSchema),
    updateProfile
);
userRouter.get('/getUser', authorization, getUser);
userRouter.post(
    '/changePassword',
    authorization,
    reqValidation(changePasswordSchema),
    changePassword
);
userRouter.post(
    '/updateProfileImage',
    authorization,
    upload.single('image'),
    updateProfileImage
);

export default userRouter;
