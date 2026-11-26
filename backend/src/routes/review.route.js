const express = require("express");
const { createReview, getPropertyReviews, getPropertyReviewSummary, getMyReviews } = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const checkRole = require("../middlewares/role.middleware");



const reviewRouter = express.Router();




reviewRouter.get("/property/:propertyId/summary", getPropertyReviewSummary);

reviewRouter.get("/property/:propertyId", getPropertyReviews);

reviewRouter.post("/create", authMiddleware, checkRole("guest"), createReview);

reviewRouter.get("/my", authMiddleware, checkRole("guest"), getMyReviews);

module.exports = reviewRouter;