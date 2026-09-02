
import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { AuthController } from "./auth.controller";
import { userValidation } from "./auth.validation";

const router = Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

// Register -> REQUESTER
router.post(
  "/register",
  validateRequest(
    userValidation.registerUserSchema,
  ),
  AuthController.registerUser,
);

// Verify email
router.post(
  "/verify-email",
  validateRequest(
    userValidation.verifyEmailSchema,
  ),
  AuthController.verifyEmail,
);

// Email + password login
router.post(
  "/login",
  validateRequest(
    userValidation.loginUserSchema,
  ),
  AuthController.loginUser,
);

// Google login
router.post(
  "/google",
  validateRequest(
    userValidation.googleLoginSchema,
  ),
  AuthController.googleLogin,
);

// Forgot password
router.post(
  "/forgot-password",
  validateRequest(
    userValidation.forgotPasswordSchema,
  ),
  AuthController.forgotPassword,
);

// Reset password
router.post(
  "/reset-password",
  validateRequest(
    userValidation.resetPasswordSchema,
  ),
  AuthController.resetPassword,
);

// Refresh token
router.post(
  "/refresh-token",
  AuthController.refreshToken,
);

// Logout
router.post(
  "/logout",
  AuthController.logoutUser,
);

// ======================================================
// PROTECTED ROUTES
// ======================================================

router.get(
  "/me",
  auth(
    Role.REQUESTER,
    Role.DONOR,
    Role.ADMIN,
  ),
  AuthController.getMe,
);

// ======================================================
// DONOR APPLICATION
// REQUESTER ONLY
// ======================================================

router.post(
  "/apply-donor",
  auth(Role.REQUESTER),
  validateRequest(
    userValidation.donorApplicationSchema,
  ),
  AuthController.applyForDonor,
);



export const AuthRoutes = router;

