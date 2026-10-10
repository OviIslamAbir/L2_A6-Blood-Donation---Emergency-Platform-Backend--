import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";

import type { Role } from "../../generated/prisma/enums";

import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";
import { AppError } from "../utils/apiError";

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
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not logged in. Please log in to access this resource.",
      );
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success || !verifiedToken.data) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid or expired access token",
      );
    }

    const { email, name, userId, role } = verifiedToken.data as JwtPayload;

    if (!email || !name || !userId || !role) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token payload");
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(role as Role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Forbidden. You don't have permission to access this resource.",
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "User not found. Please log in again.",
      );
    }

    if (user.deletedAt) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been deleted.",
      );
    }

    if (!user.isActive) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account is inactive. Please contact support.",
      );
    }

    if (!user.emailVerified) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Please verify your email first.",
      );
    }

    if (user.role !== role) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "User role has changed. Please log in again.",
      );
    }

    req.user = {
      email: user.email,
      name: user.name,
      userId: user.id,
      role: user.role,
    };

    next();
  });
};