import mongoose, { Types } from 'mongoose';

const { Schema } = mongoose;

const clothesSchema = new Schema(
    {
        cloudinaryID: {
            required: false,
            type: String
        },
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
        category: {
            required: true,
            type: String,
            enum: [
                'tshirt',
                'jacket',
                'sweater',
                'top',
                'shirt',
                'dress',
                'pants',
                'skirt',
                'shorts'
            ]
        },
        variant: {
            required: true,
            type: String
        },
        color: {
            required: true,
            type: String
        },
        layerable: {
            required: true,
            type: Boolean
        },
        image: {
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

const Clothes = mongoose.model('Clothes', clothesSchema);
export default Clothes;


export interface IClothingData {
    _id?: string;
    category: string;
    variant: string;
    color: string;
    layerable: boolean;
    bodyLocation: string[];
    image?: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: 0;
  }