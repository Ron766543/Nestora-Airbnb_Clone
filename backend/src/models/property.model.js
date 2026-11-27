const mongoose = require('mongoose')




const propertySchema = new mongoose.Schema({
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },

    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },

    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },

    propertyType: {
        type: String,
        required: true,
        enum: [
            "APARTMENT",
            "HOUSE",
            "VILLA",
            "HOTEL",
            "RESORT",
            "CABIN",
        ],
    },

    location: {
        address: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        country: {
            type: String,
            required: true,
            trim: true,
        },

        pincode: {
            type: String,
            required: true,
            trim: true,
        },

        coordinates: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },

            coordinates: {
                type: [Number],                                                    // [longitude, latitude]
                required: true,
                validate: {
                    validator: function (coordinates) {
                        return (
                            Array.isArray(coordinates) &&
                            coordinates.length === 2 &&
                            coordinates[0] >= -180 &&
                            coordinates[0] <= 180 &&
                            coordinates[1] >= -90 &&
                            coordinates[1] <= 90
                        );
                    },
                    message: "Invalid longitude or latitude.",
                },
            },
        },
    },

    price: {
        type: Number,
        required: true,
        min: 0,
    },

    maxGuests: {
        type: Number,
        required: true,
        min: 1,
    },

    bedrooms: {
        type: Number,
        required: true,
        min: 1,
    },

    bathrooms: {
        type: Number,
        required: true,
        min: 1,
    },

    amenities: [
        {
            type: String,
            trim: true,
        },
    ],

    images: [
        {
            url: {
                type: String,
                required: true,
            },

            publicId: {
                type: String,
                required: true,
            },
        },
    ],

    status: {
        type: String,
        enum: ["DRAFT", "PUBLISHED", "UNAVAILABLE"],
        default: "DRAFT",
    },
},
    {
        timestamps: true,
    }
)

propertySchema.index({ "location.coordinates": "2dsphere" });

const propertyModel = mongoose.model("listing", propertySchema);

module.exports = propertyModel;


// This schema stores properties created by Hosts.
// Why do we need it?
// - Host creates properties.
// - Guest searches properties.
// - Guest views property details.
// - Host updates or deletes listings.
// - Google Maps displays property locations.