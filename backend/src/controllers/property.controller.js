const mongoose = require("mongoose");
const propertyModel = require("../models/property.model");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary.utils");


const uploadPropertyImages = async (files = []) => {
    const uploadedImages = [];

    try {
        for (const file of files) {
            const result = await uploadToCloudinary(file.buffer);

            uploadedImages.push({
                url: result.url,
                publicId: result.publicId
            });
        }

        return uploadedImages;

    } catch (error) {
        await Promise.allSettled(
            uploadedImages.map((image) =>
                deleteFromCloudinary(image.publicId)
            )
        );

        throw error;
    }
};

const deletePropertyImages = async (images = []) => {
    await Promise.allSettled(
        images.map((image) =>
            deleteFromCloudinary(image.publicId)
        )
    );
};

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
    let uploadedImages = [];

    try {
        const { title, description, propertyType, location, price, maxGuests, bedrooms, bathrooms, amenities, status } = req.body;

        const parsedLocation = typeof location === "string" ? JSON.parse(location) : location;

        const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities;

        if (
            !parsedLocation ||
            !Array.isArray(parsedLocation.coordinates?.coordinates) ||
            parsedLocation.coordinates.coordinates.length !== 2
        ) {
            return res.status(400).json({
                message: "Valid property location is required."
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "Please upload at least one property image."
            });
        }

        uploadedImages = await uploadPropertyImages(req.files);

        const property = await propertyModel.create({
            host: req.user._id,
            title,
            description,
            propertyType,
            location: parsedLocation,
            price,
            maxGuests,
            bedrooms,
            bathrooms,
            amenities: parsedAmenities,
            images: uploadedImages,
            status: status || "DRAFT"
        });

        return res.status(201).json({
            message: "Property created successfully.",
            property
        });

    } catch (error) {
        console.error("Create property error:", error);

        await deletePropertyImages(uploadedImages);

        if (
            error.name === "ValidationError" ||
            error.name === "CastError" ||
            error instanceof SyntaxError
        ) {
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
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid property ID."
            });
        }

        const property = await propertyModel.findById(id)
            .populate("host", "name profileImage");

        if (!property || property.status !== "PUBLISHED") {
            return res.status(404).json({
                message: "Property not found."
            });
        }

        return res.status(200).json({
            property: getPublicProperty(property)
        });

    } catch (error) {
        console.error("Get property error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching property."
        });
    }
};

const getAllProperties = async (req, res) => {
    try {
        const {
            city,
            propertyType,
            minPrice,
            maxPrice,
            guests
        } = req.query;

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

    } catch (error) {
        console.error("Get all properties error:", error);

        return res.status(500).json({
            message: "Something went wrong while fetching properties."
        });
    }
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
    let newUploadedImages = [];

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

        const oldImages = property.images.map(image => ({
            publicId: image.publicId
        }));

        const allowedFields = [
            "title",
            "description",
            "propertyType",
            "price",
            "maxGuests",
            "bedrooms",
            "bathrooms",
            "status"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                property[field] = req.body[field];
            }
        });

        if (req.body.location !== undefined) {
            property.location = typeof req.body.location === "string"
                ? JSON.parse(req.body.location)
                : req.body.location;
        }

        if (req.body.amenities !== undefined) {
            property.amenities = typeof req.body.amenities === "string"
                ? JSON.parse(req.body.amenities)
                : req.body.amenities;
        }

        if (req.body.imagesToKeep !== undefined) {
            const imagesToKeep = typeof req.body.imagesToKeep === "string"
                ? JSON.parse(req.body.imagesToKeep)
                : req.body.imagesToKeep;

            if (
                !Array.isArray(imagesToKeep) ||
                !imagesToKeep.every(id => typeof id === "string")
            ) {
                return res.status(400).json({
                    message: "imagesToKeep must be an array of public IDs."
                });
            }

            const oldPublicIds = oldImages.map(image => image.publicId);

            if (!imagesToKeep.every(id => oldPublicIds.includes(id))) {
                return res.status(400).json({
                    message: "Invalid image public ID."
                });
            }

            property.images = property.images.filter(image =>
                imagesToKeep.includes(image.publicId)
            );
        }

        if (req.files && req.files.length > 0) {
            newUploadedImages = await uploadPropertyImages(req.files);

            property.images.push(...newUploadedImages);
        }

        await property.save();

        const currentImages = property.images.map(image => image.publicId);

        const removedImages = oldImages.filter(image =>
            !currentImages.includes(image.publicId)
        );

        await deletePropertyImages(removedImages);

        return res.status(200).json({
            message: "Property updated successfully.",
            property
        });

    } catch (error) {
        console.error("Update property error:", error);

        await deletePropertyImages(newUploadedImages);

        if (
            error.name === "ValidationError" ||
            error.name === "CastError" ||
            error instanceof SyntaxError
        ) {
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


module.exports = { createProperty, getPropertyById, getAllProperties, getMyProperties, updateProperty, deleteProperty, getPropertyAdminLocation };
