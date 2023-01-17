import express from 'express';
import { reqValidation } from '../../middleware/reqValidation';
import { registerUser } from './controller';
import { registerSchema } from './joiSchema';

const router = express.Router();

//create another route for login
//replace register user
router.post('/register', reqValidation(registerSchema), registerUser);
export default router;
