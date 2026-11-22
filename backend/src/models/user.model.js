const mongoose = require('mongoose')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email must be unique"],

    },
    password: {
        type: String,
        required: [true, "Password is required"],

    },
    role: {
        type: String,
        enum: ['guest', 'host', 'admin'],
        default: 'guest',

    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
    },
    profileImage: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: "active",
    },
    verified: {
        type: Boolean,
        default: false,
    },

},
    {
        timestamps: true,
    }
);

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;


// This schema stores information about all registered users.

// Why do we need it?
// - Register users.
// - Login users.
// - Identify Guests and Hosts.
// - Manage profiles.
// - Authenticate API requests.