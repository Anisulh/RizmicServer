import mongoose from 'mongoose';

const { Schema } = mongoose;

const friendsSchema = new Schema(
    {
        requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

const Friends = mongoose.model('Friends', friendsSchema);

export default Friends;
