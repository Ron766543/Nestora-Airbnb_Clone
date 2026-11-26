const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "listing",
            required: true,
        },

        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "booking",
            required: true,
            unique: true,
        },

        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number.",
            },
        },

        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    { timestamps: true }
);

const reviewModel = mongoose.model("review", reviewSchema);

module.exports = reviewModel;