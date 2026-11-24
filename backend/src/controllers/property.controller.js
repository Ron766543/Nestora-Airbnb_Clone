const mongoose = require("mongoose");
const propertyModel = require("../models/property.model");
const getPublicProperty = (property) => {
    const data = property.toObject();

    const coordinates = data.location.coordinates.coordinates;

    return {
        ...data,
        location: {
            city: data.location.city,
            state: data.location.state,
            country: data.location.country,


            coordinates: {
                type: "Point",
                coordinates: [
                    Number(coordinates[0].toFixed(2)),
                    Number(coordinates[1].toFixed(2))
                ]
            }
        }
    };
};


const createProperty = async (req, res) => {
    try {
        const { title, description, propertyType, location, price, maxGuests, bedrooms, bathrooms, amenities, images, status } = req.body;

        if (!location || !Array.isArray(location.coordinates?.coordinates)) {
            return res.status(400).json({
                message: "Valid property location is required."
            });
        }

        const property = await propertyModel.create({ host: req.user._id, title, description, propertyType, location, price, maxGuests, bedrooms, bathrooms, amenities, images, status: status || "DRAFT" });

        return res.status(201).json({
            message: "Property created successfully.",
            property
        });

    } catch (error) {
        console.error("Create property error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Something went wrong while creating property."
        });
    }
};

const getPropertyById = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid property ID."
        });
    }

    const property = await propertyModel.findById(id)
        .populate("host", "name profileImage");

    if (!property) {
        return res.status(404).json({
            message: "Property not found."
        });
    }

    if (property.status !== "PUBLISHED") {
        return res.status(404).json({
            message: "Property not found."
        });
    }

    return res.status(200).json({
        property: getPublicProperty(property)
    });

};

const getAllProperties = async (req, res) => {

    const { city, propertyType, minPrice, maxPrice, guests } = req.query;

    const filter = {
        status: "PUBLISHED"
    };

    if (city) {
        filter["location.city"] = {
            $regex: city,
            $options: "i"
        };
    }

    if (propertyType) {
        filter.propertyType = propertyType.toUpperCase();
    }

    if (minPrice || maxPrice) {
        filter.price = {};

        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (guests) {
        filter.maxGuests = {
            $gte: Number(guests)
        };
    }

    const properties = await propertyModel.find(filter)
        .populate("host", "name profileImage")
        .sort({ createdAt: -1 });

    const publicProperties = properties.map(getPublicProperty);

    return res.status(200).json({
        count: publicProperties.length,
        properties: publicProperties
    });
};

const getMyProperties = async (req, res) => {
    try {
        const properties = await propertyModel.find({
            host: req.user._id
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            count: properties.length,
            properties
        });

    } catch (error) {
        console.error("Get host properties error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching your properties."
        });
    }
};

const updateProperty = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property ID."
            });
        }

        const property = await propertyModel.findOne({
            _id: id,
            host: req.user._id
        });

        if (!property) {
            return res.status(404).json({
                message: "Property not found or you are not its owner."
            });
        }

        const allowedFields = ["title", "description", "propertyType", "location", "price", "maxGuests", "bedrooms", "bathrooms", "amenities", "images", "status"];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                property[field] = req.body[field];
            }
        });

        await property.save();

        return res.status(200).json({
            message: "Property updated successfully.",
            property
        });

    } catch (error) {
        console.error("Update property error:", error);

        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Something went wrong while updating property."
        });
    }
};

const deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property ID."
            });
        }

        const property = await propertyModel.findOne({
            _id: id,
            host: req.user._id
        });

        if (!property) {
            return res.status(404).json({
                message: "Property not found or you are not its owner."
            });
        }

        property.status = "UNAVAILABLE";

        await property.save();

        return res.status(200).json({
            message: "Property marked as unavailable successfully."
        });

    } catch (error) {
        console.error("Delete property error:", error);

        return res.status(500).json({
            message: "Something went wrong while deleting property."
        });
    }
};

const getPropertyAdminLocation = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property ID."
            });
        }

        const property = await propertyModel.findById(id)
            .select("title host location");

        if (!property) {
            return res.status(404).json({
                message: "Property not found."
            });
        }

        return res.status(200).json({
            propertyId: property._id,
            title: property.title,
            host: property.host,
            exactLocation: property.location
        });

    } catch (error) {
        console.error("Admin property location error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching property location."
        });
    }
};



module.exports = { createProperty, getPropertyById, getAllProperties, getMyProperties, updateProperty, deleteProperty, getPropertyAdminLocation }






//Task : i need to do, anyhow
// Create a property.
// Get all published properties.
// Get one property.
// Get all properties belonging to the logged-in host.
// Update a property.
// Delete a property (we'll mark it unavailable instead of permanently deleting it, so booking history can be preserved).