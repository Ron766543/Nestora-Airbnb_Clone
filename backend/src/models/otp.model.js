
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'User is required']
    },

    otpHash: {
        type: String,
        required: [true, 'OTP hash is required']
    },

    purpose: {
        type: String,
        enum: ['email-verification', 'password-reset'],
        required: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    attempts: {
        type: Number,
        default: 0
    },

    verifiedAt: {
        type: Date,
        default: null
    },

    resetTokenHash: {
        type: String,
        default: null
    }

}, { timestamps: true });

otpSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const otpModel = mongoose.model('otp', otpSchema);

module.exports = otpModel;
