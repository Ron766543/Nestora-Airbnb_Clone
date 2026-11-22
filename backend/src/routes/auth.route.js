const express = require('express')
const authController = require('../controllers/auth.controller')



const authRouter = express.Router();


authRouter.post("/register", authController.registerUser);  //1

authRouter.post("/verify-email", authController.verifyEmail);  //2

authRouter.post("/login", authController.loginUser);   //3

authRouter.get("/get-me", authController.getMe);   //4

authRouter.post("/refresh-token", authController.refreshToken);  //5

authRouter.post("/logout", authController.logoutUser);     //6

authRouter.post("/forget-password", authController.forgetPassword);

authRouter.post("/verify-otp", authController.verifyResetOtp);

authRouter.post("/reset-password", authController.resetPassword);

module.exports = authRouter;