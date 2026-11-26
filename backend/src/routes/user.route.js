const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { updateProfile } = require("../controllers/user.controller");

const userRouter = express.Router();


userRouter.patch("/me", authMiddleware, updateProfile );

module.exports = userRouter;
