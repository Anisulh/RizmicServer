import { Request, Response } from 'express';
import Friends from './model';
import { AppError } from '../../library/errorHandler';

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
    // Map over each friendship to return only the friend's data
    const friends = friendships.map((friendship) => {
        // Check if the requester is the current user, if so return the recipient
        if (friendship.requester._id.toString() === _id.toString()) {
            return {
                _id: friendship.recipient._id,
                firstName: friendship.recipient.firstName,
                lastName: friendship.recipient.lastName,
                profilePicture: friendship.recipient.profilePicture
            };
        } else {
            // Otherwise, return the requester
            return {
                _id: friendship.requester._id,
                firstName: friendship.requester.firstName,
                lastName: friendship.requester.lastName,
                profilePicture: friendship.requester.profilePicture
            };
        }
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
