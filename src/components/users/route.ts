import express from 'express';
import { registerUser } from './controller';

const router = express.Router();

//create another route for login
//replace register user
router.post('/register', registerUser); 
export default router;
