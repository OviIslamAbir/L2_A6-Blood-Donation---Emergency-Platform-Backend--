import type {
  Request,
  Response,
} from "express";

import { catchAsync } from "../../utils/catchAsync";
import { DonorMatchService } from "./donorMatch.service";


// ======================================================
// MATCH DONORS
// ======================================================

const matchDonors = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      throw new Error(
        "User information is missing in the request.",
      );
    }

    const requestId = req.params.requestId;

    if (typeof requestId !== "string" || !requestId) {
      throw new Error("Request ID is required.");
    }

    const result =
      await DonorMatchService.matchDonors(
        requestId,
        req.user.userId,
      );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },
);


// ======================================================
// GET MATCHES FOR REQUEST
// ======================================================

const getMatchesForRequest = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      throw new Error(
        "User information is missing in the request.",
      );
    }

    const requestId = req.params.requestId;

    if (typeof requestId !== "string" || !requestId) {
      throw new Error("Request ID is required.");
    }

    const result =
      await DonorMatchService.getMatchesForRequest(
        requestId,
        req.user.userId,
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);


// ======================================================
// GET MY MATCHES
// ======================================================

const getMyMatches = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      throw new Error(
        "User information is missing in the request.",
      );
    }

    const result =
      await DonorMatchService.getMyMatches(
        req.user.userId,
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  },
);


// ======================================================
// ACCEPT MATCH
// ======================================================

const acceptMatch = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      throw new Error(
        "User information is missing in the request.",
      );
    }

    const matchId = req.params.matchId;

    if (typeof matchId !== "string" || !matchId) {
      throw new Error("Match ID is required.");
    }

    const result =
      await DonorMatchService.acceptMatch(
        matchId,
        req.user.userId,
      );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },
);


// ======================================================
// REJECT MATCH
// ======================================================

const rejectMatch = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    if (!req.user) {
      throw new Error(
        "User information is missing in the request.",
      );
    }

    const matchId = req.params.matchId;

    if (typeof matchId !== "string" || !matchId) {
      throw new Error("Match ID is required.");
    }

    const result =
      await DonorMatchService.rejectMatch(
        matchId,
        req.user.userId,
      );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  },
);


export const DonorMatchController = {
  matchDonors,
  getMatchesForRequest,
  getMyMatches,
  acceptMatch,
  rejectMatch,
};