const express = require('express')
const authController = require('../controllers/auth.controller')
const upload = require('../middlewares/cloudinary.middleware');


const authRouter = express.Router();


authRouter.post("/register", upload.single("profileImage"), authController.registerUser);  //1

authRouter.post("/verify-email", authController.verifyEmail);  //2

authRouter.post("/login", authController.loginUser);   //3

authRouter.get("/get-me", authController.getMe);   //4

authRouter.post("/refresh-token", authController.refreshToken);  //5

authRouter.post("/logout", authController.logoutUser);     //6

authRouter.post("/forget-password", authController.forgetPassword);  //7

authRouter.post("/verify-otp", authController.verifyResetOtp);   //8

authRouter.post("/reset-password", authController.resetPassword);  //9

module.exports = authRouter;

// all tested