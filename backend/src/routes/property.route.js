const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');
const { createProperty, getPropertyById, getAllProperties, getMyProperties, updateProperty, deleteProperty, getPropertyAdminLocation } = require('../controllers/property.controller');
const upload = require('../middlewares/cloudinary.middleware')



const propertyRouter = express.Router();




propertyRouter.post("/create", authMiddleware, checkRole("host"), upload.array("images", 10), createProperty);

propertyRouter.get("/:id", getPropertyById);

propertyRouter.get("/", getAllProperties);

propertyRouter.get("/host/me", authMiddleware, checkRole("host"), getMyProperties);

propertyRouter.patch("/:id", authMiddleware, checkRole("host"), upload.array("images", 10), updateProperty);

propertyRouter.delete("/:id", authMiddleware, checkRole("host"), deleteProperty);

propertyRouter.get("/admin/:id/location", authMiddleware, checkRole("admin"), getPropertyAdminLocation);






module.exports = propertyRouter;