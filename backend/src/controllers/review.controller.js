const mongoose = require("mongoose");
const reviewModel = require("../models/review.model");
const bookingModel = require("../models/booking.model");
const propertyModel = require("../models/property.model");







const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                message: "Invalid booking ID.",
            });
        }

        if (
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be a whole number between 1 and 5.",
            });
        }

        if (comment !== undefined && typeof comment !== "string") {
            return res.status(400).json({
                message: "Comment must be a string.",
            });
        }

        if (comment && comment.trim().length > 1000) {
            return res.status(400).json({
                message: "Comment cannot exceed 1000 characters.",
            });
        }

        const booking = await bookingModel.findOne({
            _id: bookingId,
            guest: req.user._id,
            status: "COMPLETED",
        });

        if (!booking) {
            return res.status(404).json({
                message: "Completed booking not found.",
            });
        }

        const existingReview = await reviewModel.findOne({
            booking: booking._id,
        });

        if (existingReview) {
            return res.status(409).json({
                message: "You have already reviewed this booking.",
            });
        }

        const review = await reviewModel.create({
            property: booking.property,
            booking: booking._id,
            guest: req.user._id,
            rating,
            comment: comment?.trim() || "",
        });

        return res.status(201).json({
            message: "Review submitted successfully.",
            review,
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already reviewed this booking.",
            });
        }

        console.error("Create review error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};


const getPropertyReviews = async (req, res) => {
    try {
        const { propertyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                message: "Invalid property ID.",
            });
        }

        const property = await propertyModel.findOne({
            _id: propertyId,
            status: "PUBLISHED",
        }).select("_id");

        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
            });
        }

        const reviews = await reviewModel
            .find({ property: propertyId })
            .populate("guest", "name profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Reviews fetched successfully.",
            totalReviews: reviews.length,
            reviews,
        });

    } catch (error) {
        console.error("Get property reviews error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};


const getPropertyReviewSummary = async (req, res) => {
    try {
        const { propertyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                message: "Invalid property ID.",
            });
        }

        const property = await propertyModel.findOne({
            _id: propertyId,
            status: "PUBLISHED",
        }).select("_id");

        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
            });
        }

        const summary = await reviewModel.aggregate([
            {
                $match: {
                    property: new mongoose.Types.ObjectId(propertyId),
                },
            },
            {
                $group: {
                    _id: "$property",
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        const result = summary[0] || {
            averageRating: 0,
            totalReviews: 0,
        };

        return res.status(200).json({
            message: "Review summary fetched successfully.",
            averageRating: Number(result.averageRating.toFixed(1)),
            totalReviews: result.totalReviews,
        });

    } catch (error) {
        console.error("Review summary error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};


const getMyReviews = async (req, res) => {
    try {
        const reviews = await reviewModel
            .find({ guest: req.user._id })
            .populate("property", "title images location.city location.state")
            .populate("booking", "checkIn checkOut")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Your reviews fetched successfully.",
            totalReviews: reviews.length,
            reviews,
        });

    } catch (error) {
        console.error("Get my reviews error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
};


module.exports = {
    createReview,
    getPropertyReviews,
    getPropertyReviewSummary,
    getMyReviews,
};