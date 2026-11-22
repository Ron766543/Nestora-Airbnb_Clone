const userModel = require('../models/user.model')
const sessionModel = require('../models/session.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const config = require('../config/config')
const { sendEmail } = require('../services/email.service')
const { generateOtp, generateOtpHtml } = require('../utils/generateToken')
const otpModel = require('../models/otp.model')
const { log } = require('console')

// register user
const registerUser = async (req, res) => {
    const { name, email, password, phone, profileImage } = req.body;
    const role = "guest";
    const status = "active";

    if (!name || !email || !password || !phone || !profileImage) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters'
        });
    }

    const isUserAlreadyExist = await userModel.findOne({ email });

    if (isUserAlreadyExist) {
        return res.status(409).json({
            message: "Account already exists with this email. Please login instead.",
        })

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        profileImage,
        status
    })

    const otp = generateOtp();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await otpModel.create({
        email,
        user: user._id,
        otpHash,
        purpose: 'email-verification'
    })

    await sendEmail(email, "OTP Verification", `Your OTP is: ${otp}`, generateOtpHtml(otp))




    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            verified: user.verified,
            createdAt: user.createdAt.toLocaleString('en-IN'),
            updatedAt: user.updatedAt.toLocaleString('en-IN'),
        },

    })
}

// login user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required'
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    if (!user.verified) {
        return res.status(401).json({
            message: "Please verify your email before logging in."
        })
    }

    if (user.status !== 'active') {
        return res.status(403).json({
            message: 'Your account is not active'
        });
    }


    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    const refreshToken = jwt.sign({
        id: user._id,
        role: user.role,
    }, config.JWT_SECRET, { expiresIn: "7d" })

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id,
        role: user.role,
    }, config.JWT_SECRET, { expiresIn: "15m" })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken
    })
}

// Get-me

const getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: "Unauthorized. No valid token provided."
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized. No token provided."
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
                message: "Unauthorized. Invalid session."
            });
        }

        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: "Your account is not active"
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                profileImage: user.profileImage
            }
        });

    } catch (error) {

        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                message: "Invalid or expired access token"
            });
        }

        console.error("Get me error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching user"
        });
    }
};


// refresh token
const refreshToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;


    if (!refreshToken) {
        return res.status(401).json({
            message: "Unauthorized. No refresh token provided."
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const session = await sessionModel.findOne({
        user: decoded.id,
        revoked: false
    })
    if (!session) {
        return res.status(401).json({
            message: "Invalid refresh token"
        })
    }
    const accessToken = jwt.sign({
        id: decoded.id,
        sessionId: session._id,
        role: decoded.role,
    }, config.JWT_SECRET, { expiresIn: "15m" })

    const newRefreshToken = jwt.sign({
        id: decoded.id,
        role: decoded.role,
    }, config.JWT_SECRET, { expiresIn: "7d" })

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken
    })
}

//logout user 
const logoutUser = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    console.log("cookies:", req.cookies);

    if (!refreshToken) {
        return res.status(400).json({
            message: "No refresh token provided"
        })
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

    const session = await sessionModel.findOne({
        user: decoded.id,
        revoked: false
    })
    if (!session) {
        return res.status(400).json({
            message: "Invalid refresh token"
        })
    }
    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });
    res.status(200).json({
        message: "User logged out successfully"
    })
}

// verifyEmail
const verifyEmail = async (req, res) => {

    const { email, otp } = req.body

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const otpDoc = await otpModel.findOne({
        email,
        otpHash,
    })

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user,
        {
            verified: true
        },
        { new: true })
    await otpModel.deleteMany({
        user: otpDoc.user
    })
    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            id: user._id,
            email: user.email,
            verified: user.verified
        }
    })
}

// forget password
const forgetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: 'Email is required'
        });
    }


    const user = await userModel.findOne({
        email
    })

    if (!user || !user.verified || user.status !== 'active') {
        return res.status(200).json({
            message: 'If the account exists, an OTP will be sent.'
        });
    }

    const otp = crypto.randomInt(100000, 999999).toString().padStart(6, '0');

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    await otpModel.deleteMany({
        user: user._id,
        purpose: 'password-reset'
    })

    await otpModel.create({
        email: user.email,
        user: user._id,
        otpHash: otpHash,
        purpose: "password-reset",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        verifiedAt: null
    })

    await sendEmail(user.email, 'Password Reset OTP', `Your password reset OTP is: ${otp}`, generateOtpHtml(otp))
    return res.status(200).json({
        message: "If the account exists, an OTP will be sent."
    })

}

// verifyOTP

const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp || !/^\d{6}$/.test(String(otp))) {
        return res.status(400).json({
            message: "Email and valid 6-digit OTP are required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpDoc = await otpModel.findOne({
        email: normalizedEmail,
        purpose: "password-reset",
        expiresAt: { $gt: new Date() },
        verifiedAt: null
    });

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid or expired OTP"
        });
    }

    if (otpDoc.attempts >= 5) {
        await otpModel.deleteOne({ _id: otpDoc._id });

        return res.status(429).json({
            message: "Too many incorrect attempts. Request a new OTP."
        });
    }

    const enteredHash = crypto
        .createHash("sha256")
        .update(String(otp))
        .digest();

    const storedHash = Buffer.from(otpDoc.otpHash, "hex");

    const isValidOtp =
        storedHash.length === enteredHash.length &&
        crypto.timingSafeEqual(enteredHash, storedHash);

    if (!isValidOtp) {
        otpDoc.attempts += 1;
        await otpDoc.save();

        return res.status(400).json({
            message: "Invalid OTP",
            remainingAttempts: 5 - otpDoc.attempts
        });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    otpDoc.verifiedAt = new Date();

    otpDoc.resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    await otpDoc.save();

    return res.status(200).json({
        message: "OTP verified successfully",
        resetToken
    });
};

//resetPassword

const resetPassword = async (req, res) => {

    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
        return res.status(400).json({
            message: "Email, reset token and new password are required"
        });
    }

    if (
        typeof newPassword !== "string" ||
        newPassword.length < 8
    ) {
        return res.status(400).json({
            message: "Password must be at least 8 characters"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpDoc = await otpModel.findOne({
        email: normalizedEmail,
        purpose: "password-reset",
        verifiedAt: { $ne: null },
        expiresAt: { $gt: new Date() }
    });

    if (!otpDoc || !otpDoc.resetTokenHash) {
        return res.status(400).json({
            message: "Invalid or expired password reset request"
        });
    }
    const enteredTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest();

    const storedTokenHash = Buffer.from(
        otpDoc.resetTokenHash,
        "hex"
    );

    const isValidToken =
        storedTokenHash.length === enteredTokenHash.length &&
        crypto.timingSafeEqual(
            enteredTokenHash,
            storedTokenHash
        );

    if (!isValidToken) {
        return res.status(401).json({
            message: "Invalid reset token"
        });
    }

    const user = await userModel.findById(otpDoc.user);

    if (!user || user.status !== "active") {
        return res.status(400).json({
            message: "Unable to reset password"
        });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await otpModel.deleteOne({
        _id: otpDoc._id
    });

    await sessionModel.updateMany(
        {
            user: user._id,
            revoked: false
        },
        {
            $set: { revoked: true }
        }
    );

    return res.status(200).json({
        message: "Password reset successfully. Please login again."
    });


};



module.exports = { registerUser, getMe, refreshToken, logoutUser, loginUser, verifyEmail, forgetPassword, verifyResetOtp, resetPassword };