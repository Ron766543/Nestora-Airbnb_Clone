const mongoose = require('mongoose')


const bookingSchema = new mongoose.Schema(
    {
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "listing",
            required: true,
        },

        checkIn: {
            type: Date,
            required: true,
        },

        checkOut: {
            type: Date,
            required: true,
        },

        guests: {
            type: Number,
            required: true,
            min: 1,
        },

        totalNights: {
            type: Number,
            required: true,
            min: 1,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "CONFIRMED",
                "CANCELLED",
                "COMPLETED",
            ],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

const bookingModel = mongoose.model("booking", bookingSchema);

module.exports = bookingModel;


// This schema stores reservation information.
// Why do we need it?
// - Create reservations.
// - Check booking history.
// - Display host reservations.
// - Prevent double bookings.
// - Cancel reservations.