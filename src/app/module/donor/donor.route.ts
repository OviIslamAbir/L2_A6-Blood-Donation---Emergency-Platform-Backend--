import { Router } from "express";

import { DonorController } from "./donor.controller";
import { donorValidation } from "./donor.validation";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

// ======================================================
// DONOR PROFILE
// ======================================================

router.get("/profile", auth("DONOR"), DonorController.getDonorProfile);

// ======================================================
// APPLICATION STATUS
// ======================================================

// REQUESTER / DONOR উভয়েই নিজের application status দেখতে পারবে
router.get(
	"/application-status",
	auth(),
	DonorController.getDonorApplicationStatus,
);

// ======================================================
// UPDATE DONOR PROFILE
// ======================================================

router.patch(
	"/profile",
	auth("DONOR"),
	validateRequest(donorValidation.updateDonorProfileSchema),
	DonorController.updateDonorProfile,
);

// ======================================================
// NOTIFICATIONS
// ======================================================

router.get("/notifications", auth("DONOR"), DonorController.getMyNotifications);

router.get(
	"/notifications/unread-count",
	auth("DONOR"),
	DonorController.getUnreadNotificationCount,
);

// ======================================================
// MARK ALL READ
// ======================================================

router.patch(
	"/notifications/read-all",
	auth("DONOR"),
	DonorController.markAllNotificationsAsRead,
);

// ======================================================
// MARK ONE READ
// ======================================================

router.patch(
	"/notifications/:notificationId/read",
	auth("DONOR"),
	DonorController.markNotificationAsRead,
);

// ======================================================
// EXPORT
// ======================================================

export const DonorRoutes = router;
