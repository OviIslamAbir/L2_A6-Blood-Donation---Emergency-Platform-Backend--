import { prisma } from "../../lib/prisma";

import type { INotificationQuery } from "./notification.interface";

// ======================================================
// GET MY NOTIFICATIONS
// ======================================================

const getMyNotifications = async (
	userId: string,
	query: INotificationQuery,
) => {
	const page = Math.max(Number(query.page) || 1, 1);

	const limit = Math.min(
		Math.max(Number(query.limit) || 20, 1),
		100,
	);

	const skip = (page - 1) * limit;

	const where = {
		userId,

		...(query.isRead === "true"
			? {
					isRead: true,
				}
			: query.isRead === "false"
				? {
						isRead: false,
					}
				: {}),
	};

	const [notifications, total, unreadCount] =
		await Promise.all([
			prisma.notification.findMany({
				where,
				skip,
				take: limit,

				orderBy: {
					createdAt: "desc",
				},
			}),

			prisma.notification.count({
				where,
			}),

			prisma.notification.count({
				where: {
					userId,
					isRead: false,
				},
			}),
		]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			unreadCount,
		},

		data: notifications,
	};
};

// ======================================================
// UNREAD COUNT
// ======================================================

const getUnreadNotificationCount = async (
	userId: string,
) => {
	const count = await prisma.notification.count({
		where: {
			userId,
			isRead: false,
		},
	});

	return {
		unreadCount: count,
	};
};

// ======================================================
// MARK ONE AS READ
// ======================================================

const markNotificationAsRead = async (
	userId: string,
	notificationId: string,
) => {
	const notification = await prisma.notification.findUnique({
		where: {
			id: notificationId,
		},
	});

	if (!notification) {
		throw new Error("Notification not found.");
	}

	if (notification.userId !== userId) {
		throw new Error(
			"You cannot access this notification.",
		);
	}

	const updatedNotification =
		await prisma.notification.update({
			where: {
				id: notificationId,
			},

			data: {
				isRead: true,
			},
		});

	return updatedNotification;
};

// ======================================================
// MARK ALL AS READ
// ======================================================

const markAllNotificationsAsRead = async (
	userId: string,
) => {
	const result = await prisma.notification.updateMany({
		where: {
			userId,
			isRead: false,
		},

		data: {
			isRead: true,
		},
	});

	return {
		message: "All notifications marked as read.",
		updatedCount: result.count,
	};
};

// ======================================================
// DELETE ONE NOTIFICATION
// ======================================================

const deleteNotification = async (
	userId: string,
	notificationId: string,
) => {
	const notification = await prisma.notification.findUnique({
		where: {
			id: notificationId,
		},
	});

	if (!notification) {
		throw new Error("Notification not found.");
	}

	if (notification.userId !== userId) {
		throw new Error(
			"You cannot delete this notification.",
		);
	}

	await prisma.notification.delete({
		where: {
			id: notificationId,
		},
	});

	return {
		message: "Notification deleted successfully.",
	};
};

// ======================================================
// EXPORT
// ======================================================

export const NotificationService = {
	getMyNotifications,
	getUnreadNotificationCount,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
};