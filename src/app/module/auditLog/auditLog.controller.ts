import type {
	Request,
	Response,
} from "express";

import httpStatus from "http-status";

import { AuditLogServices } from "./auditLog.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";


// ======================================================
// GET ALL AUDIT LOGS
// ======================================================

const getAuditLogs = catchAsync(
	async (
		req: Request,
		res: Response,
	) => {
		const result =
			await AuditLogServices.getAuditLogs(
				req.query,
			);

		sendResponse(res, {
			statusCode:
				httpStatus.OK,

			success: true,

			message:
				"Audit logs retrieved successfully.",

			data: result,
		});
	},
);

// ======================================================
// GET SINGLE AUDIT LOG
// ======================================================

const getSingleAuditLog =
	catchAsync(
		async (
			req: Request,
			res: Response,
		) => {
			const auditLogId =
				req.params.auditLogId as string;

			const result =
				await AuditLogServices.getSingleAuditLog(
					auditLogId,
				);

			sendResponse(res, {
				statusCode:
					httpStatus.OK,

				success: true,

				message:
					"Audit log retrieved successfully.",

				data: result,
			});
		},
	);

export const AuditLogController = {
	getAuditLogs,
	getSingleAuditLog,
};