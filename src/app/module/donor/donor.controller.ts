import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DonorService } from "./donor.service";

// ======================================================
// GET DONOR PROFILE
// ======================================================

const getDonorProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("User information is missing in the request.");
	}

	const result = await DonorService.getDonorProfile(req.user.userId);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Donor profile retrieved successfully.",
		data: result,
	});
});

// ======================================================
// GET DONOR APPLICATION STATUS
// ======================================================

const getDonorApplicationStatus = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error("User information is missing in the request.");
		}

		const result = await DonorService.getDonorApplicationStatus(
			req.user.userId,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Donor application status retrieved successfully.",
			data: result,
		});
	},
);

// ======================================================
// UPDATE DONOR PROFILE
// ======================================================

const updateDonorProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("User information is missing in the request.");
	}

	const result = await DonorService.updateDonorProfile(
		req.user.userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Donor profile updated successfully.",
		data: result,
	});
});

// ======================================================
// GET MY NOTIFICATIONS
// ======================================================

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("User information is missing in the request.");
	}

	const result = await DonorService.getMyNotifications(req.user.userId);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Notifications retrieved successfully.",
		data: result,
	});
});

// ======================================================
// GET UNREAD NOTIFICATION COUNT
// ======================================================

const getUnreadNotificationCount = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error("User information is missing in the request.");
		}

		const result = await DonorService.getUnreadNotificationCount(
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
// MARK ONE NOTIFICATION AS READ
// ======================================================

const markNotificationAsRead = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error("User information is missing in the request.");
		}

		const notificationId = Array.isArray(req.params.notificationId)
			? req.params.notificationId[0]
			: req.params.notificationId;

		if (!notificationId) {
			throw new Error("Notification ID is required.");
		}

		const result = await DonorService.markNotificationAsRead(
			req.user.userId,
			notificationId,
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
// MARK ALL NOTIFICATIONS AS READ
// ======================================================

const markAllNotificationsAsRead = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error("User information is missing in the request.");
		}

		const result = await DonorService.markAllNotificationsAsRead(
			req.user.userId,
		);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "All notifications marked as read.",
			data: result,
		});
	},
);

// ======================================================
// EXPORT
// ======================================================

export const DonorController = {
	getDonorProfile,
	getDonorApplicationStatus,
	updateDonorProfile,
	getMyNotifications,
	getUnreadNotificationCount,
	markNotificationAsRead,
	markAllNotificationsAsRead,
};
