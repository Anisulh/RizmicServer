import { Router } from 'express';
import {
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    unfriendUser
} from './controller';
import { authorization } from '../../middleware/authorization';
import asyncHandler from 'express-async-handler';

const friendsRouter = Router();

friendsRouter.get('/', authorization, asyncHandler(getFriends));
friendsRouter.get('/requests', authorization, asyncHandler(getFriendRequests));
friendsRouter.post(
    '/request/:userId',
    authorization,
    asyncHandler(sendFriendRequest)
);
friendsRouter.put(
    '/accept/:userId',
    authorization,
    asyncHandler(acceptFriendRequest)
);
friendsRouter.delete(
    '/unfriend/:userId',
    authorization,
    asyncHandler(unfriendUser)
);

export default friendsRouter;
