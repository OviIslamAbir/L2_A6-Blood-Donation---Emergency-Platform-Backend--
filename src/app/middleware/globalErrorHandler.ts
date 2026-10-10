import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";
import config from "../config";
import { AppError } from "../utils/apiError";

export const globalErrorHandler = async (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode: number = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage = err.message || "Internal Server Error";
  let errorName = err.name || "Error";

  // AppError Handled
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  }
  // JWT Specific Errors Handled
  else if (err.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    errorMessage = "Access token has expired. Please log in again.";
    errorName = "TokenExpiredError";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = httpStatus.UNAUTHORIZED;
    errorMessage = "Invalid token provided.";
    errorName = "JsonWebTokenError";
  }
  // Prisma Errors Handled
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "You have provided incorrect field type or missing fields";
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Duplicate Key Error";
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Foreign key constraint failed";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage =
        "An operation failed because it depends on one or more records that were required but not found.";
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage =
        "Authentication failed against database server. Please Check Your Credentials";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Can't reach database server";
    }
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    errorMessage = "Error occurred during query execution";
  } else if (err instanceof Error) {
    errorMessage = err.message;
  }

  // Log only critical server errors in development (prevents 401 spam logs)
  if (config.node_env === "development" && statusCode === httpStatus.INTERNAL_SERVER_ERROR) {
    console.log("Error from Global Error Handler", err);
  }

  // FIX: Dynamic status code response instead of hardcoded 500
  res.status(statusCode).json({
    success: false,
    statusCode,
    name:
      config.node_env === "development"
        ? errorName
        : statusCode === 500
        ? "Internal Server Error"
        : errorName,
    message: errorMessage,
    error: config.node_env === "development" ? err : undefined,
    stack: config.node_env === "development" ? err.stack : undefined,
  });
};