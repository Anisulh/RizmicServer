import express from 'express';
import { reqValidation } from '../../middleware/reqValidation';
import { loginUser, registerUser } from './controller';
import { loginSchema, registerSchema } from './joiSchema';

const router = express.Router();

//create another route for login
//replace register user
router.post('/register', reqValidation(registerSchema), registerUser);
router.post('/login',reqValidation(loginSchema),loginUser);
export default router;
