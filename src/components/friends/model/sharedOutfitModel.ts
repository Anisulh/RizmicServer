import mongoose from 'mongoose';

const sharedOutfitSchema = new mongoose.Schema(
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
        outfitItem: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Outfit'
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

const SharedOutfit = mongoose.model('SharedOutfit', sharedOutfitSchema);

export default SharedOutfit;
