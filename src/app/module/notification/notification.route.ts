import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/checkAuth";

import { NotificationController } from "./notification.controller";

const router = Router();

// ======================================================
// MY NOTIFICATIONS
// ======================================================

router.get(
	"/",
	auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
	NotificationController.getMyNotifications,
);

// ======================================================
// UNREAD COUNT
// ======================================================

router.get(
	"/unread-count",
	auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
	NotificationController.getUnreadNotificationCount,
);

// ======================================================
// MARK ALL AS READ
// ======================================================

router.patch(
	"/read-all",
	auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
	NotificationController.markAllNotificationsAsRead,
);

// ======================================================
// MARK ONE AS READ
// ======================================================

router.patch(
	"/:notificationId/read",
	auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
	NotificationController.markNotificationAsRead,
);

// ======================================================
// DELETE
// ======================================================

router.delete(
	"/:notificationId",
	auth(Role.ADMIN, Role.DONOR, Role.REQUESTER),
	NotificationController.deleteNotification,
);

export const NotificationRoutes = router;