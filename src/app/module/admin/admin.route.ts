import { Router } from "express";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { AdminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

// ======================================================
// DASHBOARD
// ======================================================

router.get("/dashboard", auth("ADMIN"), AdminController.getDashboardStats);

// ======================================================
// DONOR APPLICATIONS
// ======================================================

router.get(
	"/donor-applications",
	auth("ADMIN"),
	AdminController.getDonorApplications,
);

router.get(
	"/donor-applications/pending",
	auth("ADMIN"),
	AdminController.getPendingDonorApplications,
);

// ======================================================
// APPROVE DONOR
// ======================================================

router.patch(
	"/donor/:userId/approve",
	auth("ADMIN"),
	AdminController.approveDonorApplication,
);

// ======================================================
// REJECT DONOR
// ======================================================

router.patch(
	"/donor/:userId/reject",
	auth("ADMIN"),
	validateRequest(adminValidation.rejectDonorSchema),
	AdminController.rejectDonorApplication,
);

// ======================================================
// USERS
// ======================================================

router.get("/users", auth("ADMIN"), AdminController.getAllUsers);

router.get("/users/:userId", auth("ADMIN"), AdminController.getSingleUser);

// ======================================================
// ACTIVATE / DEACTIVATE
// ======================================================

router.patch(
	"/users/:userId/status",
	auth("ADMIN"),
	validateRequest(adminValidation.updateUserStatusSchema),
	AdminController.updateUserStatus,
);

// ======================================================
// DELETE USER
// ======================================================

router.delete("/users/:userId", auth("ADMIN"), AdminController.deleteUser);

// ======================================================
// EXPORT
// ======================================================

export const AdminRoutes = router;
