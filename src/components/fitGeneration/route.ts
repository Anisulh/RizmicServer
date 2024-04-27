import express from 'express';
import { authorization } from '../../middleware/authorization';
import { generateFit } from './controller';
import asyncHandler from 'express-async-handler';

const generationRouter = express.Router();

generationRouter.post('/', authorization, asyncHandler(generateFit));

export default generationRouter;
