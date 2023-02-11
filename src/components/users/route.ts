import express from 'express';
import { reqValidation } from '../../middleware/reqValidation';
import {
    loginUser,
    registerUser,
    forgotUserPassword,
    resetPasswordController
} from './controller';
import { loginSchema, registerSchema } from './joiSchema';

const userRouter = express.Router();

userRouter.post('/register', reqValidation(registerSchema), registerUser);
userRouter.post('/login', reqValidation(loginSchema), loginUser);
userRouter.post('/forgotpassword', forgotUserPassword);
userRouter.post('/passwordreset', resetPasswordController);

export default userRouter;
