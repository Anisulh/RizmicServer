import { Router } from 'express';
import {
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    unfriendUser,
    shareClothing,
    getFriendProfile
} from './controller';
import { authorization } from '../../middleware/authorization';
import asyncHandler from 'express-async-handler';
import { shareClothesSchema } from './validationSchema';
import { reqValidation } from '../../middleware/reqValidation';

const friendsRouter = Router();

friendsRouter.get('/', authorization, asyncHandler(getFriends));
friendsRouter.get('/requests', authorization, asyncHandler(getFriendRequests));
friendsRouter.get(
    '/profile/:userId',
    authorization,
    asyncHandler(getFriendProfile)
);
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
friendsRouter.post(
    '/share/clothing/:clothesId',
    authorization,
    reqValidation(shareClothesSchema),
    asyncHandler(shareClothing)
);

export default friendsRouter;
