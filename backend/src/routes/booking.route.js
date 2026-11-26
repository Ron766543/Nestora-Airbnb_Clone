const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const checkRole = require("../middlewares/role.middleware");
const { createBooking, getMyBookings, getHostBookings, getBookingById, cancelBooking, confirmBooking, completeBooking } = require("../controllers/booking.controller");



const bookingRouter = express.Router();



bookingRouter.use(authMiddleware);

bookingRouter.post( "/create", checkRole("guest"), createBooking );

bookingRouter.get( "/my", checkRole("guest"), getMyBookings );

bookingRouter.get( "/host", checkRole("host"), getHostBookings );

bookingRouter.get( "/:id", checkRole("guest", "host"), getBookingById );

bookingRouter.patch( "/:id/cancel", checkRole("guest"), cancelBooking );

bookingRouter.patch( "/:id/confirm", checkRole("host"), confirmBooking );

bookingRouter.patch("/:id/complete", checkRole("host"), completeBooking)


module.exports = bookingRouter;
