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
// EXPORT
// ======================================================

export const DonorController = {
	getDonorProfile,
	getDonorApplicationStatus,
	updateDonorProfile,
};