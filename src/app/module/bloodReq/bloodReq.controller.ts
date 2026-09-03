import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BloodRequestService } from "./bloodReq.service";



// ======================================================
// CREATE BLOOD REQUEST
// ======================================================

const createBloodRequest = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await BloodRequestService.createBloodRequest(
				req.user.userId,
				req.body,
			);

		sendResponse(res, {
			statusCode: 201,
			success: true,
			message: result.message,
			data: result.bloodRequest,
		});
	},
);

// ======================================================
// GET MY BLOOD REQUESTS
// ======================================================

const getMyBloodRequests = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await BloodRequestService.getMyBloodRequests(
				req.user.userId,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message:
				"Blood requests retrieved successfully.",
			data: result,
		});
	},
);

// ======================================================
// GET SINGLE BLOOD REQUEST
// ======================================================

const getSingleBloodRequest = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await BloodRequestService.getSingleBloodRequest(
				req.user.userId,
				req.params.requestId as string,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message:
				"Blood request retrieved successfully.",
			data: result,
		});
	},
);

// ======================================================
// UPDATE BLOOD REQUEST
// ======================================================

const updateBloodRequest = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await BloodRequestService.updateBloodRequest(
				req.user.userId,
				req.params.requestId as string,
				req.body,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: result.bloodRequest,
		});
	},
);

// ======================================================
// CANCEL BLOOD REQUEST
// ======================================================

const cancelBloodRequest = catchAsync(
	async (req: Request, res: Response) => {
		if (!req.user) {
			throw new Error(
				"User information is missing in the request.",
			);
		}

		const result =
			await BloodRequestService.cancelBloodRequest(
				req.user.userId,
				req.params.requestId as string,
			);

		sendResponse(res, {
			statusCode: 200,
			success: true,
			message: result.message,
			data: result.bloodRequest,
		});
	},
);

// ======================================================
// EXPORT
// ======================================================

export const BloodRequestController = {
	createBloodRequest,
	getMyBloodRequests,
	getSingleBloodRequest,
	updateBloodRequest,
	cancelBloodRequest,
};