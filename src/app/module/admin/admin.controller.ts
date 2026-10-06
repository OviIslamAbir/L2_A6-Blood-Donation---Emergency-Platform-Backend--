import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "../auth/auth.interface";
import { AdminService } from "./admin.service";

// ======================================================
// DASHBOARD
// ======================================================

const getDashboardStats = catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminService.getDashboardStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Dashboard statistics retrieved successfully.",
        data: result,
    });
});

// ======================================================
// ALL DONOR APPLICATIONS
// ======================================================

const getDonorApplications = catchAsync(
    async (_req: Request, res: Response) => {
        const result = await AdminService.getDonorApplications();

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Donor applications retrieved successfully.",
            data: result,
        });
    },
);

// ======================================================
// PENDING DONOR APPLICATIONS
// ======================================================

const getPendingDonorApplications = catchAsync(
    async (_req: Request, res: Response) => {
        const result = await AdminService.getPendingDonorApplications();

        sendResponse(res, {
            statusCode: httpStatus.OK,
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
        const admin = req.user as IRequestUser;

        if (!admin) {
            throw new Error("User information is missing in the request.");
        }

        const result = await AdminService.approveDonorApplication({
            userId: String(req.params.userId),
            adminId: admin.userId,
        });

        sendResponse(res, {
            statusCode: httpStatus.OK,
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
        const admin = req.user as IRequestUser;

        if (!admin) {
            throw new Error("User information is missing in the request.");
        }

        const result = await AdminService.rejectDonorApplication({
            userId: String(req.params.userId),
            adminId: admin.userId,
            reason: req.body?.reason,
        });

        sendResponse(res, {
            statusCode: httpStatus.OK,
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
        statusCode: httpStatus.OK,
        success: true,
        message: "Users retrieved successfully.",
        data: result,
    });
});

// ======================================================
// SINGLE USER
// ======================================================

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.getSingleUser(String(req.params.userId));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User retrieved successfully.",
        data: result,
    });
});

// ======================================================
// ACTIVATE / DEACTIVATE
// ======================================================

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const admin = req.user as IRequestUser;

    if (!admin) {
        throw new Error("User information is missing in the request.");
    }

    const result = await AdminService.updateUserStatus({
        userId: String(req.params.userId),
        adminId: admin.userId,
        isActive: req.body.isActive,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result.user,
    });
});

// ======================================================
// DELETE USER
// ======================================================

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const admin = req.user as IRequestUser;

    if (!admin) {
        throw new Error("User information is missing in the request.");
    }

    const result = await AdminService.deleteUser({
        userId: String(req.params.userId),
        adminId: admin.userId,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result.user,
    });
});

// ======================================================
// GET ALL BLOOD REQUESTS FOR ADMIN
// ======================================================

const getAllBloodRequests = catchAsync(
    async (_req: Request, res: Response) => {
        const result = await AdminService.getAllBloodRequests();

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Blood requests retrieved successfully.",
            data: result,
        });
    },
);

// ======================================================
// VERIFY BLOOD REQUEST
// ======================================================

const verifyBloodRequest = catchAsync(async (req: Request, res: Response) => {
    const admin = req.user as IRequestUser;

    if (!admin) {
        throw new Error("User information is missing in the request.");
    }

    const result = await AdminService.verifyBloodRequest({
        requestId: String(req.params.requestId),
        adminId: admin.userId,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: result.bloodRequest,
    });
});

// ======================================================
// EXPORT
// ======================================================

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
    getAllBloodRequests,
    verifyBloodRequest,
};