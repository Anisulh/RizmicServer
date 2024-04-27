import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

const outfitSchema = new Schema(
    {
        cloudinaryID: {
            required: false,
            type: String
        },
        userID: {
            required: true,
            type: Types.ObjectId,
            ref: 'User'
        },
        coverImg: {
            required: false,
            type: String
        },
        name: {
            required: false,
            type: String,
            default: "Outfit"
        },
        clothes: [{ type: Types.ObjectId, ref: 'Clothes' }],
        favorited: {
            required: false,
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Outfits = mongoose.model('Outfits', outfitSchema);
export default Outfits;
