import { Request, Response } from "express";

import { DonorService } from "./donor.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";




// ======================================================
// GET PROFILE
// ======================================================

const getDonorProfile = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {

    const result =
      await DonorService.getDonorProfile(
        req.user!.userId,
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message:
        "Donor profile retrieved successfully.",
      data: result,
    });
  },
);


// ======================================================
// APPLICATION STATUS
// ======================================================

const getDonorApplicationStatus =
  catchAsync(
    async (
      req: Request,
      res: Response,
    ) => {

      const result =
        await DonorService
          .getDonorApplicationStatus(
            req.user!.userId,
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Donor application status retrieved successfully.",
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
//   updateDonorProfile,
//   getMyNotifications,
//   getUnreadNotificationCount,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
};