import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DonationService } from "./donation.service";

const createDonation = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User information is missing in the request.");
    }

    const result = await DonationService.createDonation(
      req.user.userId,
      req.body,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Donation scheduled successfully.",
      data: result,
    });
  },
);

const getMyDonations = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User information is missing in the request.");
    }

    const result = await DonationService.getMyDonations(
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Donations retrieved successfully.",
      data: result,
    });
  },
);

const getSingleDonation = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User information is missing in the request.");
    }

    const result = await DonationService.getSingleDonation(
      req.params.donationId as string,
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Donation retrieved successfully.",
      data: result,
    });
  },
);

const completeDonation = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User information is missing in the request.");
    }

    const result = await DonationService.completeDonation(
      req.params.donationId as string,
      req.user.userId,
      req.body,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Donation completed successfully.",
      data: result,
    });
  },
);

const cancelDonation = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new Error("User information is missing in the request.");
    }

    const result = await DonationService.cancelDonation(
      req.params.donationId as string,
      req.user.userId,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Donation cancelled successfully.",
      data: result,
    });
  },
);

export const DonationController = {
  createDonation,
  getMyDonations,
  getSingleDonation,
  completeDonation,
  cancelDonation,
};