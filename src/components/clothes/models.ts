import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

const clothesSchema = new Schema(
    {
        userID: {
            required: false,
            type: Types.ObjectId,
            ref: 'User'
        },
        bodyLocation: [
            {
                required: true,
                type: String,
                enum: ['head', 'upperBody', 'lowerBody', 'feet']
            }
        ],
        type: {
            required: true,
            type: String
        },
        specificType: {
            required: true,
            type: String
        },
        color: {
            required: true,
            type: String
        },
        size: {
            required: false,
            type: String
        },

        description: {
            required: false,
            type: String
        }
    },
    { timestamps: true }
);

const Clothes = mongoose.model('User', clothesSchema);
export default Clothes;
