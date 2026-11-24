
const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const checkRole = require("../middlewares/role.middleware");
const { updateUserRole, updateUserStatus } = require("../controllers/admin.controller");

const adminRouter = express.Router();

adminRouter.patch("/users/:id/role", authMiddleware, checkRole("admin"), updateUserRole);

adminRouter.patch("/users/:id/status", authMiddleware, checkRole("admin"), updateUserStatus);

module.exports = adminRouter;
