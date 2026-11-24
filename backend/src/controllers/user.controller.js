
const updateProfile = async (req, res) => {
    try {
        const { name, phone, profileImage } = req.body;

        // User is already fetched by authMiddleware
        const user = req.user;

        // Update name
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Name cannot be empty."
                });
            }

            user.name = name.trim();
        }

        // Update phone
        if (phone !== undefined) {
            if (typeof phone !== "string" || !phone.trim()) {
                return res.status(400).json({
                    message: "Phone number cannot be empty."
                });
            }

            user.phone = phone.trim();
        }

        // Update profile image
        if (profileImage !== undefined) {
            if (
                typeof profileImage !== "string" ||
                !profileImage.trim()
            ) {
                return res.status(400).json({
                    message: "Profile image cannot be empty."
                });
            }

            user.profileImage = profileImage.trim();
        }

        // Save updated user document
        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profileImage: user.profileImage,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            message: "Something went wrong while updating profile."
        });
    }
};

module.exports = { updateProfile };
