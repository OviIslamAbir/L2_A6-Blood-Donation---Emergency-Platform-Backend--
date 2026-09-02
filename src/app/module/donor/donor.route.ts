import { Router } from "express";

import { DonorController } from "./donor.controller";
import { donorValidation } from "./donor.validation";

import { auth } from "../../middleware/checkAuth";

import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";


const router = Router();


// ======================================================
// DONOR PROFILE
// ======================================================

router.get(
  "/profile",
  auth(Role.DONOR),
  DonorController.getDonorProfile,
);


router.get(
  "/application-status",
  auth(Role.DONOR),
  DonorController.getDonorApplicationStatus,
);
router.patch(
  "/profile",
  auth(Role.DONOR),
  validateRequest(
    donorValidation.updateDonorProfileSchema,
  ),
  DonorController.updateDonorProfile,
);
// ======================================================
// NOTIFICATIONS
// ======================================================

router.get(
  "/notifications",
  auth(Role.DONOR),
  DonorController.getMyNotifications,
);


router.get(
  "/notifications/unread-count",
  auth(Role.DONOR),
  DonorController.getUnreadNotificationCount,
);


router.patch(
  "/notifications/read-all",
  auth(Role.DONOR),
  DonorController.markAllNotificationsAsRead,
);


router.patch(
  "/notifications/:notificationId/read",
  auth(Role.DONOR),
  DonorController.markNotificationAsRead,
);
  

export const DonorRoutes = router;