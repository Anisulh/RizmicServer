import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

const outfitSchema = new Schema(
    {
        userID: {
            required: true,
            type: Types.ObjectId,
            ref: 'User'
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

const Outifts = mongoose.model('Outifts', outfitSchema);
export default Outifts;
