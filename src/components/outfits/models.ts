import mongoose from 'mongoose';

const outfitSchema = new mongoose.Schema(
    {
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
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
        description: {
            type: String,
            required: false
        },
        clothes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Clothing' // Reference to the Clothing schema
            }
        ],
        occasion: {
            type: String,
            required: false,
            enum: [
                'casual',
                'formal',
                'sport',
                'business',
                'party',
                'home',
                'travel',
                'festival'
            ],
            lowercase: true
        },
        season: {
            type: String,
            required: false,
            enum: ['spring', 'summer', 'autumn', 'winter'],
            lowercase: true
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
        },
        sharedWith: [
            {
                type: mongoose.Schema.Types.ObjectId,
                required: false,
                ref: 'User' // Reference to the User schema
            }
        ]
    },
    {
        timestamps: true // Adds createdAt and updatedAt timestamps
    }
);

const Outfits = mongoose.model('Outfits', outfitSchema);
export default Outfits;
