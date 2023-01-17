import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
    {
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
            required: true,
            type: String
        },
        avatar: {
            required: false,
            type: String
        }
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User