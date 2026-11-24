
const userModel = require("../models/user.model");

const updateUserRole = async (req, res) => {
    try {

        const { id } = req.params;
        const { role } = req.body;

        const allowedRoles = ["guest", "host", "admin"];

        if (!role || !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Please provide a valid role.",
                allowedRoles
            });
        }

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (user._id.equals(req.user._id)) {
            return res.status(403).json({
                message: "You cannot change your own role."
            });
        }

        if (
            user.role === "admin" &&
            user.status === "active" &&
            role !== "admin"
        ) {

            const activeAdminCount = await userModel.countDocuments({
                role: "admin",
                status: "active"
            });

            if (activeAdminCount <= 1) {
                return res.status(403).json({
                    message: "Cannot remove the last active admin."
                });
            }
        }

        user.role = role;

        await user.save();

        return res.status(200).json({
            message: "User role updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {

        console.error("Update user role error:", error);

        return res.status(500).json({
            message: "Something went wrong while updating user role."
        });
    }
};


const updateUserStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "active",
            "inactive",
            "blocked"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Please provide a valid account status.",
                allowedStatuses
            });
        }

        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (user._id.equals(req.user._id)) {
            return res.status(403).json({
                message: "You cannot change your own account status."
            });
        }

        if (
            user.role === "admin" &&
            user.status === "active" &&
            status !== "active"
        ) {

            const activeAdminCount = await userModel.countDocuments({
                role: "admin",
                status: "active"
            });

            if (activeAdminCount <= 1) {
                return res.status(403).json({
                    message: "Cannot deactivate or block the last active admin."
                });
            }
        }

        user.status = status;

        await user.save();

        return res.status(200).json({
            message: "User account status updated successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {

        console.error("Update user status error:", error);

        return res.status(500).json({
            message: "Something went wrong while updating user status."
        });
    }
};


module.exports = {updateUserRole, updateUserStatus};
