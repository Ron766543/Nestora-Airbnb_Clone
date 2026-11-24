const express = require('express')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth.route')
const userRouter = require('./routes/user.route')
const adminRouter = require('./routes/admin.route')



const app = express();
app.use(express.json());
app.use(cookieParser());



app.use('/api/auth', authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);





module.exports = app;