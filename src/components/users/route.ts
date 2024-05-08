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
    resetPassword,
    validateUser,
    googleSignIn,
    logoutUser,
    deleteUser
} from './controller';
import {
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    updateProfileSchema
} from './validationSchema';
import upload from '../../config/multer.config';
import asyncHandler from 'express-async-handler';

const userRouter = express.Router();

userRouter.post('/google-sign-in', asyncHandler(googleSignIn));
userRouter.post(
    '/register',
    reqValidation(registerSchema),
    asyncHandler(registerUser)
);
userRouter.post('/login', reqValidation(loginSchema), asyncHandler(loginUser));
userRouter.post('/logout', authorization, asyncHandler(logoutUser));
userRouter.post(
    '/forgot-password',
    reqValidation(forgotPasswordSchema),
    asyncHandler(forgotUserPassword)
);
userRouter.post(
    '/password-reset',
    reqValidation(resetPasswordSchema),
    asyncHandler(resetPassword)
);
userRouter.post(
    '/update-profile',
    authorization,
    reqValidation(updateProfileSchema),
    asyncHandler(updateProfile)
);
userRouter.get('/get-user', authorization, asyncHandler(getUser));
userRouter.get('/validate', authorization, asyncHandler(validateUser));
userRouter.post(
    '/change-password',
    authorization,
    reqValidation(changePasswordSchema),
    asyncHandler(changePassword)
);
userRouter.post(
    '/update-profile-image',
    authorization,
    upload.single('image'),
    asyncHandler(updateProfileImage)
);
userRouter.delete('/delete-account', authorization, asyncHandler(deleteUser))

export default userRouter;
