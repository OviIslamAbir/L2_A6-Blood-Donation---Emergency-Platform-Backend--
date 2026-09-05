import {
	DonorApplicationStatus,
	NotificationType,
	RequestStatus,
	Role,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";
import { transporter } from "../../lib/nodemailer";
import config from "../../config";

import path from "path";
import ejs from "ejs";

import type {
	IApproveDonorPayload,
	IRejectDonorPayload,
	IGetUsersQuery,
	IUpdateUserStatusPayload,
	IDeleteUserPayload,
	IVerifyBloodRequestPayload,
} from "./admin.interface";

// ======================================================
// ALL DONOR APPLICATIONS
// ======================================================

const getDonorApplications = async () => {
	return prisma.user.findMany({
		where: {
			donorApplicationStatus: {
				in: [
					DonorApplicationStatus.PENDING,
					DonorApplicationStatus.APPROVED,
					DonorApplicationStatus.REJECTED,
				],
			},
			deletedAt: null,
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
};

// ======================================================
// PENDING DONOR APPLICATIONS
// ======================================================

const getPendingDonorApplications = async () => {
	return prisma.user.findMany({
		where: {
			role: Role.REQUESTER,
			donorApplicationStatus: DonorApplicationStatus.PENDING,
			deletedAt: null,
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
};

// ======================================================
// APPROVE DONOR
// ======================================================

const approveDonorApplication = async (payload: IApproveDonorPayload) => {
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

	if (user.deletedAt) {
		throw new Error("This user has been deleted.");
	}

	if (!user.isActive) {
		throw new Error("This user account is inactive.");
	}

	if (user.role !== Role.REQUESTER) {
		throw new Error("Only requester accounts can be approved as donors.");
	}

	if (!user.donorProfile) {
		throw new Error("No donor application found.");
	}

	if (user.donorApplicationStatus !== DonorApplicationStatus.PENDING) {
		throw new Error("This application is not pending.");
	}

	if (!user.password) {
		throw new Error(
			"This user does not have a password login. Donor approval is not allowed.",
		);
	}

	const updatedUser = await prisma.$transaction(async (tx) => {
		const updated = await tx.user.update({
			where: {
				id: user.id,
			},

			data: {
				role: Role.DONOR,
				donorApplicationStatus: DonorApplicationStatus.APPROVED,
			},

			omit: {
				password: true,
			},
		});

		await tx.donorProfile.update({
			where: {
				userId: user.id,
			},

			data: {
				approvedAt: new Date(),
				rejectedAt: null,
				rejectReason: null,
			},
		});

		await tx.notification.create({
			data: {
				userId: user.id,
				title: "🩸 Donor Application Approved",
				message:
					"Congratulations! Your donor application has been approved. You are now a verified donor.",
				type: NotificationType.SYSTEM,
			},
		});

		return updated;
	});

	// ==================================================
	// APPROVAL EMAIL
	// ==================================================

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
		console.error("Donor approval email failed:", error);
	}

	return {
		message: "Donor application approved successfully.",
		user: updatedUser,
	};
};

// ======================================================
// REJECT DONOR
// ======================================================

const rejectDonorApplication = async (payload: IRejectDonorPayload) => {
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

	if (user.deletedAt) {
		throw new Error("This user has been deleted.");
	}

	if (!user.isActive) {
		throw new Error("This user account is inactive.");
	}

	if (user.role !== Role.REQUESTER) {
		throw new Error(
			"Only requester accounts can have a donor application rejected.",
		);
	}

	if (!user.donorProfile) {
		throw new Error("No donor application found.");
	}

	if (user.donorApplicationStatus !== DonorApplicationStatus.PENDING) {
		throw new Error("This application is not pending.");
	}

	const reason = payload.reason?.trim() || "Not specified";

	await prisma.$transaction(async (tx) => {
		await tx.user.update({
			where: {
				id: user.id,
			},

			data: {
				donorApplicationStatus: DonorApplicationStatus.REJECTED,
			},
		});

		await tx.donorProfile.update({
			where: {
				userId: user.id,
			},

			data: {
				rejectedAt: new Date(),
				rejectReason: reason,
				approvedAt: null,
			},
		});

		await tx.notification.create({
			data: {
				userId: user.id,
				title: "Donor Application Rejected",
				message: `Your donor application has been rejected. Reason: ${reason}`,
				type: NotificationType.SYSTEM,
			},
		});
	});

	return {
		message: "Donor application rejected successfully.",
	};
};

// ======================================================
// ALL USERS
// ======================================================

const getAllUsers = async (query: IGetUsersQuery) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

	const skip = (page - 1) * limit;

	const roleFilter =
		query.role === Role.DONOR ||
		query.role === Role.REQUESTER ||
		query.role === Role.ADMIN
			? query.role
			: undefined;

	const where = {
		deletedAt: null,

		...(query.search?.trim()
			? {
					OR: [
						{
							name: {
								contains: query.search.trim(),
								mode: "insensitive" as const,
							},
						},
						{
							email: {
								contains: query.search.trim(),
								mode: "insensitive" as const,
							},
						},
					],
				}
			: {}),

		...(roleFilter
			? {
					role: roleFilter,
				}
			: {}),

		...(query.isActive === "true"
			? {
					isActive: true,
				}
			: query.isActive === "false"
				? {
						isActive: false,
					}
				: {}),
	};

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
// SINGLE USER
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

	if (user.deletedAt) {
		throw new Error("This user has been deleted.");
	}

	return user;
};

// ======================================================
// ACTIVATE / DEACTIVATE
// ======================================================

const updateUserStatus = async (payload: IUpdateUserStatusPayload) => {
	const user = await prisma.user.findUnique({
		where: {
			id: payload.userId,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (user.deletedAt) {
		throw new Error("Deleted users cannot be activated or deactivated.");
	}

	if (user.role === Role.ADMIN) {
		throw new Error("Admin accounts cannot be deactivated from this endpoint.");
	}

	if (user.isActive === payload.isActive) {
		const { password: _, ...safeUser } = user;

		return {
			message: payload.isActive
				? "User is already active."
				: "User is already inactive.",

			user: safeUser,
		};
	}

	const updatedUser = await prisma.$transaction(async (tx) => {
		const updated = await tx.user.update({
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

		await tx.notification.create({
			data: {
				userId: user.id,

				title: payload.isActive ? "Account Activated" : "Account Deactivated",

				message: payload.isActive
					? "Your account has been activated by an administrator."
					: "Your account has been deactivated by an administrator.",

				type: NotificationType.SYSTEM,
			},
		});

		return updated;
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

const deleteUser = async (payload: IDeleteUserPayload) => {
	const user = await prisma.user.findUnique({
		where: {
			id: payload.userId,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (user.role === Role.ADMIN) {
		throw new Error("Admin account cannot be deleted.");
	}

	if (user.deletedAt) {
		throw new Error("User is already deleted.");
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
// VERIFY BLOOD REQUEST
// ======================================================

const verifyBloodRequest = async (payload: IVerifyBloodRequestPayload) => {
	const bloodRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: payload.requestId,
		},

		include: {
			requester: {
				select: {
					id: true,
					name: true,
					email: true,
					isActive: true,
					deletedAt: true,
				},
			},
		},
	});

	if (!bloodRequest) {
		throw new Error("Blood request not found.");
	}

	if (bloodRequest.deletedAt) {
		throw new Error("This blood request has been deleted.");
	}

	if (bloodRequest.status !== RequestStatus.PENDING) {
		throw new Error("Only pending blood requests can be verified.");
	}

	if (bloodRequest.requester.deletedAt) {
		throw new Error("The requester account has been deleted.");
	}

	if (!bloodRequest.requester.isActive) {
		throw new Error("The requester account is inactive.");
	}

	const verifiedAt = new Date();

	const verifiedRequest = await prisma.$transaction(async (tx) => {
		const updatedRequest = await tx.bloodRequest.update({
			where: {
				id: bloodRequest.id,
			},

			data: {
				status: RequestStatus.VERIFIED,
				verifiedAt,
				verifiedBy: payload.adminId,
			},
		});

		await tx.notification.create({
			data: {
				userId: bloodRequest.requesterId,

				title: "🩸 Blood Request Verified",

				message: `Your blood request for ${bloodRequest.patientName} at ${bloodRequest.hospitalName} has been verified by an administrator.`,

				type: NotificationType.REQUEST_VERIFIED,
			},
		});

		return updatedRequest;
	});

	return {
		message: "Blood request verified successfully.",
		bloodRequest: verifiedRequest,
	};
};

// ======================================================
// DASHBOARD
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
		prisma.user.count({
			where: {
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.REQUESTER,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.DONOR,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				role: Role.ADMIN,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				donorApplicationStatus: DonorApplicationStatus.PENDING,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				donorApplicationStatus: DonorApplicationStatus.APPROVED,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				donorApplicationStatus: DonorApplicationStatus.REJECTED,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				isActive: true,
				deletedAt: null,
			},
		}),

		prisma.user.count({
			where: {
				isActive: false,
				deletedAt: null,
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
	verifyBloodRequest,
	getAllUsers,
	getSingleUser,
	updateUserStatus,
	deleteUser,
	getDashboardStats,
};
