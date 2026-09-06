import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { AuthController } from "./auth.controller";
import { userValidation } from "./auth.validation";

const router = Router();

// ======================================================
// REGISTER
// ======================================================

router.post(
	"/register",
	validateRequest(userValidation.registerUserSchema),
	AuthController.registerUser,
);

// ======================================================
// VERIFY EMAIL
// ======================================================

router.post(
	"/verify-email",
	validateRequest(userValidation.verifyEmailSchema),
	AuthController.verifyEmail,
);

// ======================================================
// LOGIN
// ======================================================

router.post(
	"/login",
	validateRequest(userValidation.loginUserSchema),
	AuthController.loginUser,
);

// ======================================================
// GOOGLE LOGIN
// ======================================================

router.post(
	"/google",
	validateRequest(userValidation.googleLoginSchema),
	AuthController.googleLogin,
);

// ======================================================
// FORGOT PASSWORD
// ======================================================

router.post(
	"/forgot-password",
	validateRequest(userValidation.forgotPasswordSchema),
	AuthController.forgotPassword,
);

// ======================================================
// RESET PASSWORD
// ======================================================

router.post(
	"/reset-password",
	validateRequest(userValidation.resetPasswordSchema),
	AuthController.resetPassword,
);

// ======================================================
// REFRESH TOKEN
// ======================================================

router.post("/refresh-token", AuthController.refreshToken);

// ======================================================
// LOGOUT
// ======================================================

router.post("/logout", AuthController.logoutUser);

// ======================================================
// CURRENT LOGGED-IN USER
// ======================================================

router.get(
	"/me",
	auth(Role.REQUESTER, Role.DONOR, Role.ADMIN),
	AuthController.getMe,
);

// ======================================================
// APPLY FOR DONOR
// REQUESTER ONLY
// ======================================================

router.post(
	"/apply-donor",
	auth(Role.REQUESTER),
	validateRequest(userValidation.donorApplicationSchema),
	AuthController.applyForDonor,
);

export const AuthRoutes = router;
