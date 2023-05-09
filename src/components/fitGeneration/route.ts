import express from 'express';
import { authorization } from '../../middleware/authorization';
import { generateFit } from './controller';

const generationRouter = express.Router();

generationRouter.post('/', authorization, generateFit);
export default generationRouter;