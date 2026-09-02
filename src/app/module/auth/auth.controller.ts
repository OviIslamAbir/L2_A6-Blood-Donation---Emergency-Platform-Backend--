
import type {
  Request,
  Response,
} from "express";

import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

import type {
  IRequestUser,
} from "./auth.interface";

import { AuthService } from "./auth.service";

// ======================================================
// COOKIE OPTIONS
// ======================================================

const isProduction =
  process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction
    ? ("none" as const)
    : ("lax" as const),
  maxAge: 1000 * 60 * 60 * 24,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction
    ? ("none" as const)
    : ("lax" as const),
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

// ======================================================
// REGISTER
// ======================================================

const registerUser = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await AuthService.registerUser(
        req.body,
      );

    sendResponse(res, {
      statusCode:
        httpStatus.CREATED,
      success: true,
      message:
        "Registration initiated. Please verify your email using the OTP sent to your email.",
      data: result,
    });
  },
);

// ======================================================
// VERIFY EMAIL
// ======================================================

const verifyEmail = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await AuthService.verifyEmail(
        req.body,
      );

    const {
      accessToken,
      refreshToken,
      user,
    } = result;

    res.cookie(
      "accessToken",
      accessToken,
      accessCookieOptions,
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Email verified successfully. Your account has been created.",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  },
);

// ======================================================
// LOGIN
// ======================================================

const loginUser = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await AuthService.loginUser(
        req.body,
      );

    const {
      accessToken,
      refreshToken,
      user,
    } = result;

    res.cookie(
      "accessToken",
      accessToken,
      accessCookieOptions,
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "User logged in successfully",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  },
);

// ======================================================
// GET ME
// ======================================================

const getMe = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const user =
      req.user as IRequestUser;

    if (!user) {
      throw new Error(
        "User information is missing in the request",
      );
    }

    const result =
      await AuthService.getMe(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "User profile fetched successfully",
      data: result,
    });
  },
);

// ======================================================
// REFRESH TOKEN
// ======================================================

const refreshToken = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const token =
      req.cookies?.refreshToken;

    if (!token) {
      throw new Error(
        "Refresh token is missing",
      );
    }

    const result =
      await AuthService.refreshToken(
        token,
      );

    const {
      accessToken,
      refreshToken:
        newRefreshToken,
    } = result;

    res.cookie(
      "accessToken",
      accessToken,
      accessCookieOptions,
    );

    res.cookie(
      "refreshToken",
      newRefreshToken,
      refreshCookieOptions,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "New tokens generated successfully",
      data: {
        accessToken,
        refreshToken:
          newRefreshToken,
      },
    });
  },
);

// ======================================================
// GOOGLE LOGIN
// ======================================================

const googleLogin = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await AuthService.googleLogin(
        req.body,
      );

    const {
      accessToken,
      refreshToken,
      user,
    } = result;

    res.cookie(
      "accessToken",
      accessToken,
      accessCookieOptions,
    );

    res.cookie(
      "refreshToken",
      refreshToken,
      refreshCookieOptions,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Google login successful",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  },
);

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await AuthService.forgotPassword(
        req.body,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  },
);

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const result =
      await AuthService.resetPassword(
        req.body,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: result.message,
      data: null,
    });
  },
);

// ======================================================
// LOGOUT
// ======================================================

const logoutUser = catchAsync(
  async (
    _req: Request,
    res: Response,
  ) => {
    res.clearCookie(
      "accessToken",
      accessCookieOptions,
    );

    res.clearCookie(
      "refreshToken",
      refreshCookieOptions,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "User logged out successfully",
      data: null,
    });
  },
);

// ======================================================
// APPLY FOR DONOR
// ======================================================

const applyForDonor = catchAsync(
  async (
    req: Request,
    res: Response,
  ) => {
    const user =
      req.user as IRequestUser;

    if (!user) {
      throw new Error(
        "User information is missing in the request",
      );
    }

    const result =
      await AuthService.applyForDonor({
        ...req.body,
        userId: user.userId,
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
// EXPORT
// ======================================================

export const AuthController = {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
  logoutUser,
  applyForDonor,
};

