import mongoose from 'mongoose';

const sharedClothingSchema = new mongoose.Schema(
    {
        sharedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        sharedWith: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        clothingItem: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Clothing'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: false
        }
    },
    { timestamps: true }
);

const SharedClothing = mongoose.model('SharedClothing', sharedClothingSchema);

export default SharedClothing;

export interface ISharedClothingData {
    _id?: mongoose.Types.ObjectId;
    sharedBy: mongoose.Types.ObjectId;
    sharedWith: mongoose.Types.ObjectId;
    clothingItem: mongoose.Types.ObjectId;
    status: string;
    sharedAt: Date;
    expiresAt?: Date;
}
