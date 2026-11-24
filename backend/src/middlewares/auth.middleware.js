const jwt = require("jsonwebtoken");
const userModel = require('../models/user.model');
const sessionModel = require("../models/session.model");
const config = require("../config/config");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized. Please login first."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Access token is required."
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);

        const session = await sessionModel.findOne({
            _id: decoded.sessionId,
            user: decoded.id,
            revoked: false
        });

        if (!session) {
            return res.status(401).json({
                message: "Invalid or expired session."
            });
        }

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found."
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                message: `Your account is ${user.status}. Access denied.`
            });
        }

        req.user = user;

        next();

    } catch (error) {

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired access token."
            });
        }

        console.error("Authentication middleware error:", error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

module.exports = authMiddleware;
