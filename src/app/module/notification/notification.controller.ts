import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import { NotificationService } from "./notification.service";

// ======================================================
// GET MY NOTIFICATIONS
// ======================================================

const getMyNotifications = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await NotificationService.getMyNotifications(
				req.user.userId,
				req.query,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Notifications retrieved successfully.",
			data: result,
		});
	},
);

// ======================================================
// UNREAD COUNT
// ======================================================

const getUnreadNotificationCount = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await NotificationService.getUnreadNotificationCount(
				req.user.userId,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Unread notification count retrieved successfully.",
			data: result,
		});
	},
);

// ======================================================
// MARK ONE READ
// ======================================================

const markNotificationAsRead = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await NotificationService.markNotificationAsRead(
				req.user.userId,
				String(req.params.notificationId),
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Notification marked as read.",
			data: result,
		});
	},
);

// ======================================================
// MARK ALL READ
// ======================================================

const markAllNotificationsAsRead = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await NotificationService.markAllNotificationsAsRead(
				req.user.userId,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: result,
		});
	},
);

// ======================================================
// DELETE
// ======================================================

const deleteNotification = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await NotificationService.deleteNotification(
				req.user.userId,
				String(req.params.notificationId),
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: null,
		});
	},
);

export const NotificationController = {
	getMyNotifications,
	getUnreadNotificationCount,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
};