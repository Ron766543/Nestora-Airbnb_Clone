const express = require('express')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth.route')
const userRouter = require('./routes/user.route')
const adminRouter = require('./routes/admin.route')
const propertyRouter = require("./routes/property.route");
const bookingRouter = require("./routes/booking.route");
const reviewRouter = require("./routes/review.route");

const app = express();
app.use(express.json());
app.use(cookieParser());



app.use('/api/auth', authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/propertie", propertyRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/reviews", reviewRouter);



module.exports = app;