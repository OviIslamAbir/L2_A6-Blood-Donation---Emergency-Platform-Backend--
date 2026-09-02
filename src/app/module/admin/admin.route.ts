import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { AdminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

// ======================================================
// DASHBOARD
// ======================================================

router.get("/dashboard", auth(Role.ADMIN), AdminController.getDashboardStats);

// ======================================================
// DONOR APPLICATIONS
// ======================================================

router.get(
	"/donor-applications",
	auth(Role.ADMIN),
	AdminController.getDonorApplications,
);

router.get(
	"/donor-applications/pending",
	auth(Role.ADMIN),
	AdminController.getPendingDonorApplications,
);

// ======================================================
// APPROVE DONOR
// ======================================================

router.patch(
	"/donor/:userId/approve",
	auth(Role.ADMIN),
	AdminController.approveDonorApplication,
);

// ======================================================
// REJECT DONOR
// ======================================================

router.patch(
	"/donor/:userId/reject",
	auth(Role.ADMIN),
	validateRequest(adminValidation.rejectDonorSchema),
	AdminController.rejectDonorApplication,
);

// ======================================================
// USERS
// ======================================================

router.get("/users", auth(Role.ADMIN), AdminController.getAllUsers);

router.get("/users/:userId", auth(Role.ADMIN), AdminController.getSingleUser);

// ======================================================
// ACTIVATE / DEACTIVATE USER
// ======================================================

router.patch(
	"/users/:userId/status",
	auth(Role.ADMIN),
	validateRequest(adminValidation.updateUserStatusSchema),
	AdminController.updateUserStatus,
);

// ======================================================
// DELETE USER
// ======================================================

router.delete("/users/:userId", auth(Role.ADMIN), AdminController.deleteUser);

export const AdminRoutes = router;
