import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        googleID: { type: String, required: false },
        cloudinaryID: { type: String, required: false },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{+\w+)*$/,
                'Please fill a valid email address'
            ]
        },
        password: {
            type: String,
            required: false
        },
        profilePicture: { type: String, required: false },
        phoneNumber: {
            type: String,
            required: false,
            match: [
                /^\+?(\d{1,3})?[-. ]?\(?\d+\)?[-. ]?\d+[-. ]?\d+$/,
                'Please fill a valid phone number'
            ]
        },
        termsOfService: {
            agreed: { type: Boolean, required: true, default: false },
            dateAgreed: { type: Date, required: true }
        },
        privacyPolicy: {
            agreed: { type: Boolean, required: true, default: false },
            dateAgreed: { type: Date, required: true }
        },
        resetPasswordToken: {
            type: String,
            required: false
        },
        resetPasswordExpires: {
            type: Number,
            required: false
        }
    },
    {
        timestamps: true,
        methods: {
            createPasswordResetToken() {
                // Generate a random token
                const resetToken = crypto.randomBytes(20).toString('hex');

                // Hash token (private modification before saving it to the database)
                this.resetPasswordToken = crypto
                    .createHash('sha256')
                    .update(resetToken)
                    .digest('hex');

                // Set expire time (1 hour from now)
                this.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds

                return resetToken; // This will be sent to the user's email
            },
            async resetPassword(submittedToken: string, newPassword: string) {
                const hashedToken = crypto
                    .createHash('sha256')
                    .update(submittedToken)
                    .digest('hex');

                // Check if the hashed token and the expiry are still valid
                if (
                    this.resetPasswordToken === hashedToken &&
                    this.resetPasswordExpires &&
                    this.resetPasswordExpires > Date.now()
                ) {
                    const salt = await bcrypt.genSalt(10);
                    this.password = await bcrypt.hash(newPassword, salt);

                    // Clear the reset token fields
                    this.resetPasswordToken = undefined;
                    this.resetPasswordExpires = undefined;

                    // Save the updated user
                    await this.save();
                    return {
                        success: true,
                        message: 'Password has been reset successfully.'
                    };
                } else {
                    return {
                        success: false,
                        message:
                            'Password reset token is invalid or has expired.'
                    };
                }
            }
        }
    }
);

// Middleware to hash password and check phone number uniqueness before saving
userSchema.pre('save', async function (next) {
    // Hash the password if it has been modified
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // Check phone number uniqueness if it's provided
    if (this.isModified('phoneNumber') && this.phoneNumber) {
        const existingUser = await mongoose
            .model('User')
            .findOne({ phoneNumber: this.phoneNumber });

        if (
            existingUser &&
            existingUser._id.toString() !== this._id.toString()
        ) {
            // Mimic Mongoose unique index error
            const error = new mongoose.Error.ValidationError();
            error.addError(
                'phoneNumber',
                new mongoose.Error.ValidatorError({
                    message:
                        'Error, expected `{PATH}` to be unique. Value: `{VALUE}`',
                    path: 'phoneNumber',
                    value: this.phoneNumber,
                    reason: 'uniqueViolation'
                })
            );
            next(error);
        } else {
            next();
        }
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);

export default User;
