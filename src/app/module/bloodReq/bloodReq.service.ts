import {
	NotificationType,
	RequestStatus,
	Role,
	Urgency,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";

import type {
	ICreateBloodRequestPayload,
	IUpdateBloodRequestPayload,
} from "./bloodReq.interface";

// ======================================================
// CREATE BLOOD REQUEST
// ======================================================

const createBloodRequest = async (
	requesterId: string,
	payload: ICreateBloodRequestPayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: requesterId,
		},
		select: {
			id: true,
			name: true,
			role: true,
			requesterType: true,
			isActive: true,
			deletedAt: true,
			emailVerified: true,
		},
	});

	if (!user) {
		throw new Error("User not found.");
	}

	if (user.deletedAt) {
		throw new Error("Your account has been deleted.");
	}

	if (!user.isActive) {
		throw new Error("Your account is inactive.");
	}

	if (!user.emailVerified) {
		throw new Error("Please verify your email first.");
	}

	if (user.role !== Role.REQUESTER) {
		throw new Error("Only requester accounts can create blood requests.");
	}

	if (!user.requesterType) {
		throw new Error(
			"Requester type is not configured. Please complete your profile.",
		);
	}

	let neededAt: Date | undefined;

	if (payload.neededAt !== undefined) {
		const parsedDate = new Date(payload.neededAt);

		if (Number.isNaN(parsedDate.getTime())) {
			throw new Error("Invalid needed date.");
		}

		neededAt = parsedDate;
	}

	const bloodRequest = await prisma.bloodRequest.create({
		data: {
			requesterId,
			requesterType: user.requesterType,

			patientName: payload.patientName.trim(),
			bloodGroup: payload.bloodGroup,
			units: payload.units,

			hospitalName: payload.hospitalName.trim(),
			hospitalAddress: payload.hospitalAddress.trim(),

			...(payload.division !== undefined && {
				division: payload.division.trim(),
			}),

			...(payload.district !== undefined && {
				district: payload.district.trim(),
			}),

			...(payload.latitude !== undefined && {
				latitude: payload.latitude,
			}),

			...(payload.longitude !== undefined && {
				longitude: payload.longitude,
			}),

			urgency: payload.urgency ?? Urgency.NORMAL,

			...(neededAt !== undefined && {
				neededAt,
			}),

			...(payload.reason !== undefined && {
				reason: payload.reason.trim(),
			}),

			status: RequestStatus.PENDING,
		},
	});

	// ==================================================
	// NOTIFY ADMINS
	// ==================================================

	const admins = await prisma.user.findMany({
		where: {
			role: Role.ADMIN,
			isActive: true,
			deletedAt: null,
		},
		select: {
			id: true,
		},
	});

	if (admins.length > 0) {
		const isCritical = bloodRequest.urgency === Urgency.CRITICAL;

		await prisma.notification.createMany({
			data: admins.map((admin) => ({
				userId: admin.id,

				title: isCritical
					? "🚨 Critical Blood Request"
					: "🩸 New Blood Request",

				message: isCritical
					? `A critical ${bloodRequest.bloodGroup} blood request has been created for ${bloodRequest.patientName} at ${bloodRequest.hospitalName}.`
					: `A new ${bloodRequest.bloodGroup} blood request has been created for ${bloodRequest.patientName} at ${bloodRequest.hospitalName}.`,

				type: NotificationType.BLOOD_REQUEST,
			})),
		});
	}

	return {
		message: "Blood request created successfully.",
		bloodRequest,
	};
};

// ======================================================
// GET MY BLOOD REQUESTS
// ======================================================

const getMyBloodRequests = async (requesterId: string) => {
	const requests = await prisma.bloodRequest.findMany({
		where: {
			requesterId,
			deletedAt: null,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return {
		requests,
	};
};

// ======================================================
// GET SINGLE BLOOD REQUEST
// ======================================================

const getSingleBloodRequest = async (
	requesterId: string,
	requestId: string,
) => {
	const bloodRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
		include: {
			donorMatches: true,
			donations: true,
		},
	});

	if (!bloodRequest) {
		throw new Error("Blood request not found.");
	}

	if (bloodRequest.deletedAt) {
		throw new Error("This blood request has been deleted.");
	}

	if (bloodRequest.requesterId !== requesterId) {
		throw new Error("You cannot access this blood request.");
	}

	return bloodRequest;
};

// ======================================================
// UPDATE BLOOD REQUEST
// ======================================================

const updateBloodRequest = async (
	requesterId: string,
	requestId: string,
	payload: IUpdateBloodRequestPayload,
) => {
	const existingRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!existingRequest) {
		throw new Error("Blood request not found.");
	}

	if (existingRequest.deletedAt) {
		throw new Error("This blood request has been deleted.");
	}

	if (existingRequest.requesterId !== requesterId) {
		throw new Error("You cannot update this blood request.");
	}

	if (existingRequest.status !== RequestStatus.PENDING) {
		throw new Error("Only pending blood requests can be updated.");
	}

	let neededAt: Date | undefined;

	if (payload.neededAt !== undefined) {
		const parsedDate = new Date(payload.neededAt);

		if (Number.isNaN(parsedDate.getTime())) {
			throw new Error("Invalid needed date.");
		}

		neededAt = parsedDate;
	}

	const bloodRequest = await prisma.bloodRequest.update({
		where: {
			id: requestId,
		},
		data: {
			...(payload.patientName !== undefined && {
				patientName: payload.patientName.trim(),
			}),

			...(payload.bloodGroup !== undefined && {
				bloodGroup: payload.bloodGroup,
			}),

			...(payload.units !== undefined && {
				units: payload.units,
			}),

			...(payload.hospitalName !== undefined && {
				hospitalName: payload.hospitalName.trim(),
			}),

			...(payload.hospitalAddress !== undefined && {
				hospitalAddress: payload.hospitalAddress.trim(),
			}),

			...(payload.division !== undefined && {
				division: payload.division.trim(),
			}),

			...(payload.district !== undefined && {
				district: payload.district.trim(),
			}),

			...(payload.latitude !== undefined && {
				latitude: payload.latitude,
			}),

			...(payload.longitude !== undefined && {
				longitude: payload.longitude,
			}),

			...(payload.urgency !== undefined && {
				urgency: payload.urgency,
			}),

			...(neededAt !== undefined && {
				neededAt,
			}),

			...(payload.reason !== undefined && {
				reason: payload.reason.trim(),
			}),
		},
	});

	return {
		message: "Blood request updated successfully.",
		bloodRequest,
	};
};

// ======================================================
// CANCEL BLOOD REQUEST
// ======================================================

const cancelBloodRequest = async (
	requesterId: string,
	requestId: string,
) => {
	const existingRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!existingRequest) {
		throw new Error("Blood request not found.");
	}

	if (existingRequest.deletedAt) {
		throw new Error("This blood request has already been deleted.");
	}

	if (existingRequest.requesterId !== requesterId) {
		throw new Error("You cannot cancel this blood request.");
	}

	if (existingRequest.status !== RequestStatus.PENDING) {
		throw new Error("Only pending blood requests can be cancelled.");
	}

	const bloodRequest = await prisma.bloodRequest.update({
		where: {
			id: requestId,
		},
		data: {
			deletedAt: new Date(),
			status: RequestStatus.CANCELLED,
		},
	});

	return {
		message: "Blood request cancelled successfully.",
		bloodRequest,
	};
};

export const BloodRequestService = {
	createBloodRequest,
	getMyBloodRequests,
	getSingleBloodRequest,
	updateBloodRequest,
	cancelBloodRequest,
};