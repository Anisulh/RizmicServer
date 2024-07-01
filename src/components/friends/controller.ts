import { Request, Response } from 'express';
import Friends from './model';
import { AppError, HttpCode } from '../../library/errorHandler';
import SharedClothing from './model/sharedClothingModel';
import mongoose from 'mongoose';
import User from '../users/model';
import Clothing from '../clothes/models';

interface IUser {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
}

interface IFriendship {
    requester: IUser;
    recipient: IUser;
    status: string;
}

export async function getFriends(req: Request, res: Response) {
    const { _id } = req.user;
    const friendships = await Friends.find({
        $or: [{ requester: _id }, { recipient: _id }],
        status: 'accepted'
    })
        .populate('requester recipient', 'firstName lastName profilePicture')
        .lean<IFriendship[]>();

    const friendIds = friendships.map((friendship) =>
        friendship.requester._id.toString() === _id.toString()
            ? friendship.recipient._id
            : friendship.requester._id
    );

    const sharedClothes = await SharedClothing.find({
        sharedBy: _id,
        sharedWith: { $in: friendIds }
    })
        .populate('clothingItem')
        .lean();

    interface SharedClothingMap {
        [key: string]: typeof sharedClothes;
    }
    const sharedClothesByFriend = sharedClothes.reduce<SharedClothingMap>(
        (acc, item) => {
            const friendId = item.sharedWith.toString();
            if (!acc[friendId]) acc[friendId] = [];
            acc[friendId].push(item);
            return acc;
        },
        {}
    );

    const friends = friendships.map((friendship) => {
        const friend =
            friendship.requester._id.toString() === _id.toString()
                ? friendship.recipient
                : friendship.requester;

        return {
            _id: friend._id,
            firstName: friend.firstName,
            lastName: friend.lastName,
            profilePicture: friend.profilePicture,
            sharedClothes: sharedClothesByFriend[friend._id.toString()] || []
        };
    });

    res.status(200).json(friends);
}

export async function getFriendRequests(req: Request, res: Response) {
    const { _id } = req.user;
    const friendRequests = await Friends.find({
        recipient: _id,
        status: 'pending'
    })
        .populate('requester', 'firstName lastName profilePicture')
        .lean();

    res.status(200).json(friendRequests);
}

export async function sendFriendRequest(req: Request, res: Response) {
    const { userId } = req.params;
    const { _id } = req.user;

    if (_id === userId) {
        throw new AppError({
            message: 'You cannot send a friend request to yourself',
            httpCode: 400
        });
    }

    const friendRequest = await Friends.findOne({
        $or: [
            {
                requester: _id,
                recipient: userId,
                status: { $in: ['pending', 'accepted'] }
            },
            {
                requester: userId,
                recipient: _id,
                status: { $in: ['pending', 'accepted'] }
            }
        ]
    }).lean();

    if (friendRequest) {
        throw new AppError({
            message: 'Friend request already sent',
            httpCode: 400
        });
    }

    await Friends.create({ requester: _id, recipient: userId });

    res.status(200).json({ message: 'Friend request sent' });
}

export async function acceptFriendRequest(req: Request, res: Response) {
    const { userId } = req.params;
    const { _id } = req.user;

    const friendRequest = await Friends.findOneAndUpdate(
        { requester: userId, recipient: _id },
        { status: 'accepted' }
    );

    if (!friendRequest) {
        throw new AppError({
            message: 'Friend request not found',
            httpCode: 404
        });
    }

    res.status(200).json({ message: 'Friend request accepted' });
}

export async function unfriendUser(req: Request, res: Response) {
    const { userId } = req.params;
    const { _id } = req.user;

    const friendRequest = await Friends.findOneAndDelete({
        $or: [
            { requester: _id, recipient: userId },
            { requester: userId, recipient: _id }
        ]
    });

    if (!friendRequest) {
        throw new AppError({
            message: 'Friend request not found',
            httpCode: 404
        });
    }

    res.status(200).json({ message: 'Friend removed' });
}

export const shareClothing = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const clothesId = req.params.clothesId;
    const friends = req.body.friends;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const selectedClothes = await Clothing.findOne({
            userID: _id,
            _id: clothesId
        })
            .lean()
            .session(session);

        if (!selectedClothes) {
            throw new AppError({
                name: 'No clothes found',
                message:
                    'Unable to find clothes matching the provided id or belonging to user',
                httpCode: HttpCode.NOT_FOUND
            });
        }

        const validFriends = await User.find({ _id: { $in: friends } })
            .lean()
            .session(session);
        if (validFriends.length !== friends.length) {
            throw new AppError({
                name: 'Invalid friends',
                message: 'One or more provided friend IDs are invalid',
                httpCode: HttpCode.BAD_REQUEST
            });
        }

        const sharePromises = friends.map(async (friend: IUser) => {
            const alreadyShared = await SharedClothing.findOne({
                sharedBy: _id,
                sharedWith: friend,
                clothingItem: clothesId,
                status: 'accepted'
            })
                .lean()
                .session(session);

            if (!alreadyShared) {
                return SharedClothing.create(
                    [
                        {
                            sharedBy: _id,
                            sharedWith: friend,
                            clothingItem: clothesId,
                            status: 'accepted'
                        }
                    ],
                    { session }
                );
            }
        });

        await Promise.all(sharePromises);

        await session.commitTransaction();
        res.status(200).json({
            message: 'Successfully shared!',
            sharedWith: friends.length,
            clothingItem: clothesId
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const getFriendProfile = async (req: Request, res: Response) => {
    const _id = req.user._id;
    const friendId = req.params.userId;
    const [friend, friendship] = await Promise.all([
        User.findById(friendId)
            .select('profilePicture firstName lastName')
            .lean(),
        Friends.findOne({
            $or: [
                { requester: _id, recipient: friendId },
                { requester: friendId, recipient: _id }
            ],
            status: 'accepted'
        }).lean()
    ]);

    if (!friend) {
        throw new AppError({
            name: 'Invalid friend',
            message: 'Friend ID not valid',
            httpCode: HttpCode.BAD_REQUEST
        });
    }

    if (!friendship) {
        throw new AppError({
            name: 'Friend not found',
            message: 'Friendship not found',
            httpCode: HttpCode.NOT_FOUND
        });
    }
    const sharedClothes = await SharedClothing.find({
        sharedBy: friendId,
        sharedWith: _id,
        status: 'accepted'
    })
        .populate('clothingItem')
        .lean();

    const friendProfile = {
        ...friend,
        sharedClothes,
        sharedOutfits: [],
        since: friendship.createdAt
    };
    res.status(200).json(friendProfile);
};
