import mongoose from 'mongoose';

const clothingSchema = new mongoose.Schema(
    {
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User' // Assuming there is a User model for referencing
        },
        cloudinaryID: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            enum: [
                't-shirt',
                'jacket',
                'sweater',
                'top',
                'shirt',
                'dress',
                'pants',
                'skirt',
                'shorts',
                'accessories'
            ]
        },
        size: {
            type: String,
            required: true,
            enum: ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl']
        },
        color: {
            type: String,
            required: true
        },
        material: {
            type: String,
            required: false
        },
        brand: {
            type: String,
            required: false
        },
        condition: {
            type: String,
            required: true,
            enum: ['new', 'like new', 'good', 'fair', 'poor']
        },
        purchaseDate: {
            type: Date,
            required: false
        },
        price: {
            type: Number,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        careInstructions: {
            type: String,
            required: false
        },
        image: {
            type: String,
            required: false
        },
        tags: [
            {
                type: String,
                required: false
            }
        ],
        favorited: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true // Adds createdAt and updatedAt timestamps
    }
);

const Clothing = mongoose.model('Clothing', clothingSchema);

export default Clothing;

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
