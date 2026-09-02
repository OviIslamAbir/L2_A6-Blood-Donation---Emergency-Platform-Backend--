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
// UPDATE PROFILE
// ======================================================

const updateDonorProfile =
  catchAsync(
    async (
      req: Request,
      res: Response,
    ) => {

      const result =
        await DonorService
          .updateDonorProfile(
            req.user!.userId,
            req.body,
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Donor profile updated successfully.",
        data: result,
      });
    },
  );

// ======================================================
// GET NOTIFICATIONS
// ======================================================

const getMyNotifications =
  catchAsync(
    async (
      req: Request,
      res: Response,
    ) => {

      const result =
        await DonorService
          .getMyNotifications(
            req.user!.userId,
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Notifications retrieved successfully.",
        data: result,
      });
    },
  );


// ======================================================
// UNREAD COUNT
// ======================================================

const getUnreadNotificationCount =
  catchAsync(
    async (
      req: Request,
      res: Response,
    ) => {

      const result =
        await DonorService
          .getUnreadNotificationCount(
            req.user!.userId,
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Unread notification count retrieved successfully.",
        data: result,
      });
    },
  );


// ======================================================
// MARK ONE READ
// ======================================================

const markNotificationAsRead =
  catchAsync(
    async (
      req: Request,
      res: Response,
    ) => {

      const result =
        await DonorService
          .markNotificationAsRead(
            req.user!.userId,
            req.params.notificationId as string,
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "Notification marked as read.",
        data: result,
      });
    },
  );


// ======================================================
// MARK ALL READ
// ======================================================

const markAllNotificationsAsRead =
  catchAsync(
    async (
      req: Request,
      res: Response,
    ) => {

      const result =
        await DonorService
          .markAllNotificationsAsRead(
            req.user!.userId,
          );

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message:
          "All notifications marked as read.",
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