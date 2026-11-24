const mongoose = require("mongoose");

const bookingModel = require("../models/booking.model");
const propertyModel = require("../models/property.model");

const parseDate = (value) => {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return null;
    }

    return date;
};


const createBooking = async (req, res) => {
    try {
        const { propertyId, checkIn, checkOut, guests } = req.body;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                message: "Valid property ID is required."
            });
        }

        const startDate = parseDate(checkIn);
        const endDate = parseDate(checkOut);

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "Dates must be valid and use YYYY-MM-DD format."
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                message: "Check-out must be after check-in."
            });
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (startDate < today) {
            return res.status(400).json({
                message: "Check-in date cannot be in the past."
            });
        }

        const guestCount = Number(guests);

        if (
            !Number.isInteger(guestCount) ||
            guestCount < 1
        ) {
            return res.status(400).json({
                message: "At least one guest is required."
            });
        }

        const property = await propertyModel.findOne({
            _id: propertyId,
            status: "PUBLISHED"
        });

        if (!property) {
            return res.status(404).json({
                message: "Property not found or unavailable."
            });
        }

        if (property.host.toString() === req.user._id.toString()) {
            return res.status(403).json({
                message: "You cannot book your own property."
            });
        }

        if (guestCount > property.maxGuests) {
            return res.status(400).json({
                message: `This property allows maximum ${property.maxGuests} guests.`
            });
        }

        const millisecondsPerDay = 24 * 60 * 60 * 1000;

        const totalNights = Math.round(
            (endDate - startDate) / millisecondsPerDay
        );

        const existingBooking = await bookingModel.findOne({
            property: propertyId,
            status: {
                $in: ["PENDING", "CONFIRMED"]
            },
            checkIn: {
                $lt: endDate
            },
            checkOut: {
                $gt: startDate
            }
        });

        if (existingBooking) {
            return res.status(409).json({
                message: "Property is not available for these dates."
            });
        }

        const totalAmount = property.price * totalNights;

        const booking = await bookingModel.create({
            guest: req.user._id,
            host: property.host,
            property: property._id,
            checkIn: startDate,
            checkOut: endDate,
            guests: guestCount,
            totalNights,
            totalAmount,
            status: "PENDING"
        });

        return res.status(201).json({
            message: "Booking request created successfully.",
            booking
        });

    } catch (error) {
        console.error("Create booking error:", error);

        return res.status(500).json({
            message: "Something went wrong while creating booking."
        });
    }
};


const getMyBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.find({
            guest: req.user._id
        })
            .populate("property", "title images price location.city location.state")
            .populate("host", "name profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error("Get my bookings error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching bookings."
        });
    }
};


const getHostBookings = async (req, res) => {
    try {
        const bookings = await bookingModel.find({
            host: req.user._id
        })
            .populate("guest", "name profileImage")
            .populate("property", "title images price location.city")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: bookings.length,
            bookings
        });

    } catch (error) {
        console.error("Get host bookings error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching host bookings."
        });
    }
};


const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        const booking = await bookingModel.findById(id)
            .populate("guest", "name profileImage")
            .populate("host", "name profileImage")
            .populate("property", "title images price location.city location.state");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const userId = req.user._id.toString();

        const isGuest = booking.guest._id.toString() === userId;
        const isHost = booking.host._id.toString() === userId;

        if (!isGuest && !isHost) {
            return res.status(403).json({
                message: "You are not allowed to view this booking."
            });
        }

        return res.status(200).json({
            booking
        });

    } catch (error) {
        console.error("Get booking error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching booking."
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        const booking = await bookingModel.findOne({
            _id: id,
            guest: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (["CANCELLED", "COMPLETED"].includes(booking.status)) {
            return res.status(400).json({
                message: `Booking cannot be cancelled because it is ${booking.status}.`
            });
        }

        booking.status = "CANCELLED";

        await booking.save();

        return res.status(200).json({
            message: "Booking cancelled successfully.",
            booking
        });

    } catch (error) {
        console.error("Cancel booking error:", error);

        return res.status(500).json({
            message: "Something went wrong while cancelling booking."
        });
    }
};


const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid booking ID."
            });
        }

        const booking = await bookingModel.findOne({
            _id: id,
            host: req.user._id
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (booking.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending bookings can be confirmed."
            });
        }

        booking.status = "CONFIRMED";

        await booking.save();

        return res.status(200).json({
            message: "Booking confirmed successfully.",
            booking
        });

    } catch (error) {
        console.error("Confirm booking error:", error);

        return res.status(500).json({
            message: "Something went wrong while confirming booking."
        });
    }
};


module.exports = { createBooking, getMyBookings, getHostBookings, getBookingById, cancelBooking, confirmBooking };