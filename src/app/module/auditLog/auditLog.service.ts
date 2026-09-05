import httpStatus from "http-status";

import type {
	ICreateAuditLogPayload,
	IGetAuditLogsQuery,
} from "./auditLog.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/apiError";

// ======================================================
// CREATE AUDIT LOG
// ======================================================

const createAuditLog = async (payload: ICreateAuditLogPayload) => {
	return await prisma.auditLog.create({
		data: {
			userId: payload.userId,

			action: payload.action,

			entity: payload.entity,

			entityId: payload.entityId,

			oldValue:
				payload.oldValue !== undefined ? (payload.oldValue as any) : undefined,

			newValue:
				payload.newValue !== undefined ? (payload.newValue as any) : undefined,

			ipAddress: payload.ipAddress,
		},
	});
};

// ======================================================
// GET ALL AUDIT LOGS
// ADMIN ONLY
// ======================================================

const getAuditLogs = async (query: IGetAuditLogsQuery) => {
	const page = query.page || 1;

	const limit = query.limit || 20;

	const skip = (page - 1) * limit;

	const where: {
		entity?: string;
		action?: string;
		userId?: string;
	} = {};

	if (query.entity) {
		where.entity = query.entity;
	}

	if (query.action) {
		where.action = query.action;
	}

	if (query.userId) {
		where.userId = query.userId;
	}

	const [logs, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,

			skip,

			take: limit,

			orderBy: {
				createdAt: "desc",
			},

			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
			},
		}),

		prisma.auditLog.count({
			where,
		}),
	]);

	const totalPages = Math.ceil(total / limit);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages,
		},

		data: logs,
	};
};

// ======================================================
// GET SINGLE AUDIT LOG
// ======================================================

const getSingleAuditLog = async (auditLogId: string) => {
	const auditLog = await prisma.auditLog.findUnique({
		where: {
			id: auditLogId,
		},

		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
	});

	if (!auditLog) {
		throw new AppError(httpStatus.NOT_FOUND, "Audit log not found.");
	}

	return auditLog;
};

export const AuditLogServices = {
	createAuditLog,
	getAuditLogs,
	getSingleAuditLog,
};
