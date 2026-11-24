const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const checkRole = require("../middlewares/role.middleware");
const { createBooking, getMyBookings, getHostBookings, getBookingById, cancelBooking, confirmBooking } = require("../controllers/booking.controller");



const bookingRouter = express.Router();



bookingRouter.use(authMiddleware);

bookingRouter.post( "/", checkRole("guest"), createBooking );

bookingRouter.get( "/my", checkRole("guest"), getMyBookings );

bookingRouter.patch( "/:id/cancel", checkRole("guest"), cancelBooking );

bookingRouter.get( "/host", checkRole("host"), getHostBookings );

bookingRouter.patch( "/:id/confirm", checkRole("host"), confirmBooking );

bookingRouter.get( "/:id", checkRole("guest", "host"), getBookingById );


module.exports = bookingRouter;
