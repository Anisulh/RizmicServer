import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        googleID: {
            required: false,
            type: String
        },
        cloudinaryID: {
            required: false,
            type: String
        },
        firstName: {
            required: true,
            type: String
        },
        lastName: {
            required: true,
            type: String
        },
        email: {
            required: true,
            type: String
        },
        password: {
            required: false,
            type: String
        },
        profilePicture: {
            required: false,
            type: String
        },
        phoneNumber: {
            required: false,
            type: String
        }
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
