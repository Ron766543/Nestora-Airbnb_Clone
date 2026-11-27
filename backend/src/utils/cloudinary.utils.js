const cloudinary = require('../config/cloudinary');


const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'airbnb/properties',
                resource_type: "image"
            },

            (err, res) => {
                if (err) {
                    return reject(err);
                }

                res({
                    url: res.secure_url,
                    publicId: res.public_id
                });
            }
        );

        uploadStream.end(fileBuffer);
    })
}

const deleteFromCloudinary = async (publicId) => {
    return cloudinary.uploader.destroy(publicId);


}



module.exports = { uploadToCloudinary, deleteFromCloudinary };