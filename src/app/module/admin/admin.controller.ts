import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

// ======================================================
// DASHBOARD
// ======================================================

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getDashboardStats();

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Dashboard statistics retrieved successfully.",
		data: result,
	});
});

// ======================================================
// ALL DONOR APPLICATIONS
// ======================================================

const getDonorApplications = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getDonorApplications();

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Donor applications retrieved successfully.",
		data: result,
	});
});

// ======================================================
// PENDING APPLICATIONS
// ======================================================

const getPendingDonorApplications = catchAsync(
	async (req: Request, res: Response) => {
		const result = await AdminService.getPendingDonorApplications();

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: "Pending donor applications retrieved successfully.",
			data: result,
		});
	},
);

// ======================================================
// APPROVE DONOR
// ======================================================

const approveDonorApplication = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error("User information is missing in the request.");
		}

		const result = await AdminService.approveDonorApplication({
			userId: req.params.userId as string,
			adminId: req.user.userId,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: result.user,
		});
	},
);

// ======================================================
// REJECT DONOR
// ======================================================

const rejectDonorApplication = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error("User information is missing in the request.");
		}

		const result = await AdminService.rejectDonorApplication({
			userId: req.params.userId as string,
			adminId: req.user.userId,
			reason: req.body?.reason,
		});

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: null,
		});
	},
);

// ======================================================
// ALL USERS
// ======================================================

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getAllUsers(req.query);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "Users retrieved successfully.",
		data: result,
	});
});

// ======================================================
// SINGLE USER
// ======================================================

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.getSingleUser(req.params.userId as string);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: "User retrieved successfully.",
		data: result,
	});
});

// ======================================================
// ACTIVATE / DEACTIVATE
// ======================================================

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new Error("User information is missing in the request.");
	}

	const result = await AdminService.updateUserStatus({
		userId: req.params.userId as string,
		adminId: req.user.userId,
		isActive: req.body.isActive,
	});

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: result.message,
		data: result.user,
	});
});

// ======================================================
// DELETE USER
// ======================================================

const deleteUser = catchAsync(async (req: Request, res: Response) => {
	const result = await AdminService.deleteUser(req.params.userId as string);

	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: result.message,
		data: result.user,
	});
});

export const AdminController = {
	getDashboardStats,
	getDonorApplications,
	getPendingDonorApplications,
	approveDonorApplication,
	rejectDonorApplication,
	getAllUsers,
	getSingleUser,
	updateUserStatus,
	deleteUser,
};
