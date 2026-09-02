import type { NextFunction, Request, Response } from "express";

import type { JwtPayload } from "jsonwebtoken";

import type { Role } from "../../generated/prisma/enums";

import config from "../config";

import { prisma } from "../lib/prisma";

import { catchAsync } from "../utils/catchAsync";

import { jwtUtils } from "../utils/jwt";

declare global {
	namespace Express {
		interface Request {
			user?: {
				email: string;
				name: string;
				userId: string;
				role: Role;
			};
		}
	}
}

export const auth = (...requiredRoles: Role[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		// ==================================================
		// Get token
		// ==================================================

		const token = req.cookies?.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw new Error(
				"You are not logged in. Please log in to access this resource.",
			);
		}

		// ==================================================
		// Verify token
		// ==================================================

		const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

		if (!verifiedToken.success || !verifiedToken.data) {
			throw new Error("Invalid or expired access token");
		}

		const { email, name, userId, role } = verifiedToken.data as JwtPayload;

		if (!email || !name || !userId || !role) {
			throw new Error("Invalid token payload");
		}

		// ==================================================
		// Role authorization
		// ==================================================

		if (requiredRoles.length && !requiredRoles.includes(role as Role)) {
			throw new Error(
				"Forbidden. You don't have permission to access this resource.",
			);
		}

		// ==================================================
		// Check user from database
		// ==================================================

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		});

		if (!user) {
			throw new Error("User not found. Please log in again.");
		}

		// ==================================================
		// Account status
		// ==================================================

		if (!user.isActive) {
			throw new Error("Your account is inactive. Please contact support.");
		}

		if (user.deletedAt) {
			throw new Error("Your account has been deleted.");
		}

		// ==================================================
		// Email verification
		// ==================================================

		if (!user.emailVerified) {
			throw new Error("Please verify your email first.");
		}

		// ==================================================
		// Set request user
		// ==================================================

		req.user = {
			email: user.email,
			name: user.name,
			userId: user.id,
			role: user.role,
		};

		next();
	});
};
