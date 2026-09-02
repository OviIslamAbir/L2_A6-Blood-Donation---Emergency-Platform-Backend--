import path from "path";
import ejs from "ejs";

import {
	Role,
} from "../../../generated/prisma/enums";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { transporter } from "../../lib/nodemailer";

import type {
	IApproveDonorPayload,
	IRejectDonorPayload,
	IGetUsersQuery,
	IUpdateUserStatusPayload,
} from "./admin.interface";


// ======================================================
// GET ALL DONOR APPLICATIONS
// ======================================================

const getDonorApplications = async () => {
	const applications = await prisma.user.findMany({
		where: {
			donorApplicationStatus: {
				in: ["PENDING", "APPROVED", "REJECTED"],
			},
		},
		include: {
			donorProfile: true,
		},
		omit: {
			password: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return applications;
};


// ======================================================
// GET PENDING DONOR APPLICATIONS
// ======================================================

const getPendingDonorApplications = async () => {
	const applications = await prisma.user.findMany({
		where: {
			role: Role.REQUESTER,
			donorApplicationStatus: "PENDING",
		},
		include: {
			donorProfile: true,
		},
		omit: {
			password: true,
		},
		orderBy: {
			createdAt: "asc",
		},
	});

	return applications;
};


// ======================================================
// APPROVE DONOR APPLICATION
// REQUESTER -> DONOR
// ======================================================

const approveDonorApplication = async (
	payload: IApproveDonorPayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: payload.userId,
		},
		include: {
			donorProfile: true,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (!user.donorProfile) {
		throw new Error("No donor application found.");
	}

	if (user.role !== Role.REQUESTER) {
		throw new Error(
			"Only requester accounts can be approved as donors.",
		);
	}

	if (user.donorApplicationStatus !== "PENDING") {
		throw new Error("This application is not pending.");
	}

	// Donor must have password login
	if (!user.password) {
		throw new Error(
			"This user does not have a password login. Donor approval is not allowed.",
		);
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			role: Role.DONOR,
			donorApplicationStatus: "APPROVED",
		},
		omit: {
			password: true,
		},
	});

	await prisma.donorProfile.update({
		where: {
			userId: user.id,
		},
		data: {
			approvedAt: new Date(),
			rejectedAt: null,
			rejectReason: null,
		},
	});

	// Send approval email
	try {
		const templatePath = path.join(
			process.cwd(),
			"src/app/templates/donor-approved.ejs",
		);

		const html = await ejs.renderFile(templatePath, {
			name: updatedUser.name,
		});

		await transporter.sendMail({
			from: config.email_sender,
			to: updatedUser.email,
			subject: "You Are Now a Verified Donor 🩸",
			html,
		});
	} catch (error) {
		console.log("Donor approval email failed:", error);
	}

	return {
		message: "Donor application approved successfully.",
		user: updatedUser,
	};
};


// ======================================================
// REJECT DONOR APPLICATION
// ======================================================

const rejectDonorApplication = async (
	payload: IRejectDonorPayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: payload.userId,
		},
		include: {
			donorProfile: true,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (!user.donorProfile) {
		throw new Error("No donor application found.");
	}

	if (user.donorApplicationStatus !== "PENDING") {
		throw new Error("This application is not pending.");
	}

	await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			donorApplicationStatus: "REJECTED",
		},
	});

	await prisma.donorProfile.update({
		where: {
			userId: user.id,
		},
		data: {
			rejectedAt: new Date(),
			rejectReason: payload.reason ?? "Not specified",
		},
	});

	return {
		message: "Donor application rejected successfully.",
	};
};


// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (
	query: IGetUsersQuery,
) => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || 10;

	const skip = (page - 1) * limit;

	const where: any = {};

	// Search by name/email
	if (query.search) {
		where.OR = [
			{
				name: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				email: {
					contains: query.search,
					mode: "insensitive",
				},
			},
		];
	}

	// Filter role
	if (query.role) {
		where.role = query.role;
	}

	// Filter active status
	if (query.isActive !== undefined) {
		where.isActive = query.isActive === "true";
	}

	const [users, total] = await Promise.all([
		prisma.user.findMany({
			where,
			skip,
			take: limit,
			omit: {
				password: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		}),

		prisma.user.count({
			where,
		}),
	]);

	return {
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		data: users,
	};
};


// ======================================================
// GET SINGLE USER
// ======================================================

const getSingleUser = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		include: {
			donorProfile: true,
			bloodRequests: true,
		},
		omit: {
			password: true,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	return user;
};


// ======================================================
// ACTIVATE / DEACTIVATE USER
// ======================================================

const updateUserStatus = async (
	payload: IUpdateUserStatusPayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: payload.userId,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	// Prevent admin from disabling another admin
	if (user.role === Role.ADMIN) {
		throw new Error(
			"Admin accounts cannot be deactivated from this endpoint.",
		);
	}

	const updatedUser = await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			isActive: payload.isActive,
		},
		omit: {
			password: true,
		},
	});

	return {
		message: payload.isActive
			? "User activated successfully."
			: "User deactivated successfully.",
		user: updatedUser,
	};
};


// ======================================================
// DELETE USER
// ======================================================

const deleteUser = async (
	userId: string,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (user.role === Role.ADMIN) {
		throw new Error("Admin account cannot be deleted.");
	}

	const deletedUser = await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			deletedAt: new Date(),
			isActive: false,
		},
		omit: {
			password: true,
		},
	});

	return {
		message: "User deleted successfully.",
		user: deletedUser,
	};
};


// ======================================================
// DASHBOARD STATISTICS
// ======================================================

const getDashboardStats = async () => {
	const [
		totalUsers,
		totalRequesters,
		totalDonors,
		totalAdmins,
		pendingApplications,
		approvedApplications,
		rejectedApplications,
		activeUsers,
		inactiveUsers,
	] = await Promise.all([
		prisma.user.count(),

		prisma.user.count({
			where: {
				role: Role.REQUESTER,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.DONOR,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.ADMIN,
			},
		}),

		prisma.user.count({
			where: {
				donorApplicationStatus: "PENDING",
			},
		}),

		prisma.user.count({
			where: {
				donorApplicationStatus: "APPROVED",
			},
		}),

		prisma.user.count({
			where: {
				donorApplicationStatus: "REJECTED",
			},
		}),

		prisma.user.count({
			where: {
				isActive: true,
			},
		}),

		prisma.user.count({
			where: {
				isActive: false,
			},
		}),
	]);

	return {
		users: {
			total: totalUsers,
			requesters: totalRequesters,
			donors: totalDonors,
			admins: totalAdmins,
			active: activeUsers,
			inactive: inactiveUsers,
		},

		donorApplications: {
			pending: pendingApplications,
			approved: approvedApplications,
			rejected: rejectedApplications,
		},
	};
};


export const AdminService = {
	getDonorApplications,
	getPendingDonorApplications,
	approveDonorApplication,
	rejectDonorApplication,
	getAllUsers,
	getSingleUser,
	updateUserStatus,
	deleteUser,
	getDashboardStats,
};