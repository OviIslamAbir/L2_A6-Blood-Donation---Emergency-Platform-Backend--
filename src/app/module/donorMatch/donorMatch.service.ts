import {
	BloodGroup,
	MatchStatus,
	NotificationType,
	RequestStatus,
	Role,
} from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";

// ======================================================
// BLOOD COMPATIBILITY
// ======================================================

const compatibleDonorGroups: Record<BloodGroup, BloodGroup[]> = {
	[BloodGroup.O_NEGATIVE]: [BloodGroup.O_NEGATIVE],

	[BloodGroup.O_POSITIVE]: [BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE],

	[BloodGroup.A_NEGATIVE]: [BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE],

	[BloodGroup.A_POSITIVE]: [
		BloodGroup.O_NEGATIVE,
		BloodGroup.O_POSITIVE,
		BloodGroup.A_NEGATIVE,
		BloodGroup.A_POSITIVE,
	],

	[BloodGroup.B_NEGATIVE]: [BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE],

	[BloodGroup.B_POSITIVE]: [
		BloodGroup.O_NEGATIVE,
		BloodGroup.O_POSITIVE,
		BloodGroup.B_NEGATIVE,
		BloodGroup.B_POSITIVE,
	],

	[BloodGroup.AB_NEGATIVE]: [
		BloodGroup.O_NEGATIVE,
		BloodGroup.A_NEGATIVE,
		BloodGroup.B_NEGATIVE,
		BloodGroup.AB_NEGATIVE,
	],

	[BloodGroup.AB_POSITIVE]: [
		BloodGroup.O_NEGATIVE,
		BloodGroup.O_POSITIVE,
		BloodGroup.A_NEGATIVE,
		BloodGroup.A_POSITIVE,
		BloodGroup.B_NEGATIVE,
		BloodGroup.B_POSITIVE,
		BloodGroup.AB_NEGATIVE,
		BloodGroup.AB_POSITIVE,
	],
};

// ======================================================
// DISTANCE CALCULATION
// Haversine Formula
// ======================================================

const calculateDistanceKm = (
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number => {
	const earthRadiusKm = 6371;

	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return earthRadiusKm * c;
};

// ======================================================
// MATCH SCORE
// ======================================================

const calculateMatchScore = (
	requestDistrict: string | null,
	requestDivision: string | null,
	donorDistrict: string | null,
	donorDivision: string | null,
	distanceKm: number | null,
): number => {
	let score = 50;

	// Same district
	if (
		requestDistrict &&
		donorDistrict &&
		requestDistrict.toLowerCase() === donorDistrict.toLowerCase()
	) {
		score += 25;
	}

	// Same division
	else if (
		requestDivision &&
		donorDivision &&
		requestDivision.toLowerCase() === donorDivision.toLowerCase()
	) {
		score += 15;
	}

	// Distance score
	if (distanceKm !== null) {
		if (distanceKm <= 5) {
			score += 25;
		} else if (distanceKm <= 10) {
			score += 20;
		} else if (distanceKm <= 25) {
			score += 15;
		} else if (distanceKm <= 50) {
			score += 10;
		} else if (distanceKm <= 100) {
			score += 5;
		}
	}

	return Math.min(score, 100);
};

// ======================================================
// CREATE DONOR MATCHES
// ======================================================

const matchDonors = async (requestId: string, requesterId: string) => {
	const requester = await prisma.user.findUnique({
		where: {
			id: requesterId,
		},
		select: {
			id: true,
			role: true,
			isActive: true,
			deletedAt: true,
			emailVerified: true,
		},
	});

	if (!requester) {
		throw new Error("User not found.");
	}

	if (requester.deletedAt) {
		throw new Error("Your account has been deleted.");
	}

	if (!requester.isActive) {
		throw new Error("Your account is inactive.");
	}

	if (!requester.emailVerified) {
		throw new Error("Please verify your email first.");
	}

	if (requester.role !== Role.REQUESTER) {
		throw new Error("Only requesters can find donors for a blood request.");
	}

	// ----------------------------------------------------
	// GET BLOOD REQUEST
	// ----------------------------------------------------

	const bloodRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!bloodRequest) {
		throw new Error("Blood request not found.");
	}

	if (bloodRequest.deletedAt) {
		throw new Error("This blood request has been deleted.");
	}

	if (bloodRequest.requesterId !== requesterId) {
		throw new Error(
			"You don't have permission to match donors for this request.",
		);
	}

	if (
		bloodRequest.status === RequestStatus.CANCELLED ||
		bloodRequest.status === RequestStatus.COMPLETED ||
		bloodRequest.status === RequestStatus.REJECTED
	) {
		throw new Error("Donors cannot be matched for this request.");
	}

	// ----------------------------------------------------
	// FIND COMPATIBLE DONORS
	// ----------------------------------------------------

	const compatibleGroups = compatibleDonorGroups[bloodRequest.bloodGroup];

	const donors = await prisma.donorProfile.findMany({
		where: {
			isAvailable: true,

			bloodGroup: {
				in: compatibleGroups,
			},

			user: {
				role: Role.DONOR,
				isActive: true,
				deletedAt: null,
				emailVerified: true,
			},
		},

		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
				},
			},
		},
	});

	if (donors.length === 0) {
		throw new Error("No compatible available donors found.");
	}

	// ----------------------------------------------------
	// CREATE MATCHES
	// ----------------------------------------------------

	const matches = [];

	for (const donor of donors) {
		// Prevent duplicate matching
		const existingMatch = await prisma.donorMatch.findUnique({
			where: {
				requestId_donorId: {
					requestId,
					donorId: donor.id,
				},
			},
		});

		if (existingMatch) {
			continue;
		}

		let distanceKm: number | null = null;

		if (
			bloodRequest.latitude !== null &&
			bloodRequest.longitude !== null &&
			donor.latitude !== null &&
			donor.longitude !== null
		) {
			distanceKm = calculateDistanceKm(
				Number(bloodRequest.latitude),
				Number(bloodRequest.longitude),
				Number(donor.latitude),
				Number(donor.longitude),
			);

			distanceKm = Number(distanceKm.toFixed(2));
		}

		const matchScore = calculateMatchScore(
			bloodRequest.district,
			bloodRequest.division,
			donor.district,
			donor.division,
			distanceKm,
		);

		const match = await prisma.donorMatch.create({
			data: {
				requestId,
				donorId: donor.id,
				distanceKm,
				matchScore,
				status: MatchStatus.NOTIFIED,
				notifiedAt: new Date(),
			},

			include: {
				donor: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								phone: true,
							},
						},
					},
				},
			},
		});

		// --------------------------------------------------
		// CREATE NOTIFICATION
		// --------------------------------------------------

		await prisma.notification.create({
			data: {
				userId: donor.userId,
				title:
					bloodRequest.urgency === "CRITICAL"
						? "🚨 Critical Blood Request"
						: "🩸 Blood Donation Request",

				message:
					`A ${bloodRequest.bloodGroup} blood request ` +
					`has been found near ${bloodRequest.hospitalName}. ` +
					`Please check the request and respond if you are available.`,

				type: NotificationType.BLOOD_REQUEST,
			},
		});

		matches.push(match);
	}

	// ----------------------------------------------------
	// UPDATE REQUEST STATUS
	// ----------------------------------------------------

	if (matches.length > 0) {
		await prisma.bloodRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: RequestStatus.MATCHING,
			},
		});
	}

	return {
		message:
			matches.length > 0
				? "Compatible donors matched successfully."
				: "No new compatible donors found.",

		totalMatches: matches.length,
		matches,
	};
};

// ======================================================
// GET MATCHES FOR REQUEST
// ======================================================

const getMatchesForRequest = async (requestId: string, requesterId: string) => {
	const request = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
		select: {
			id: true,
			requesterId: true,
			deletedAt: true,
		},
	});

	if (!request) {
		throw new Error("Blood request not found.");
	}

	if (request.deletedAt) {
		throw new Error("This blood request has been deleted.");
	}

	if (request.requesterId !== requesterId) {
		throw new Error("You don't have permission to view these matches.");
	}

	const matches = await prisma.donorMatch.findMany({
		where: {
			requestId,
		},

		include: {
			donor: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
				},
			},
		},

		orderBy: [
			{
				matchScore: "desc",
			},
			{
				createdAt: "desc",
			},
		],
	});

	return {
		totalMatches: matches.length,
		matches,
	};
};

// ======================================================
// GET MY MATCHES - DONOR
// ======================================================

const getMyMatches = async (donorUserId: string) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},

		include: {
			user: {
				select: {
					id: true,
					role: true,
					isActive: true,
					deletedAt: true,
					emailVerified: true,
				},
			},
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found.");
	}

	if (donor.user.deletedAt) {
		throw new Error("Your account has been deleted.");
	}

	if (!donor.user.isActive) {
		throw new Error("Your account is inactive.");
	}

	if (!donor.user.emailVerified) {
		throw new Error("Please verify your email first.");
	}

	if (donor.user.role !== Role.DONOR) {
		throw new Error("Only donors can view donor matches.");
	}

	const matches = await prisma.donorMatch.findMany({
		where: {
			donorId: donor.id,
		},

		include: {
			request: {
				select: {
					id: true,
					patientName: true,
					bloodGroup: true,
					units: true,
					hospitalName: true,
					hospitalAddress: true,
					division: true,
					district: true,
					urgency: true,
					status: true,
					neededAt: true,
					reason: true,
					createdAt: true,
				},
			},
		},

		orderBy: [
			{
				status: "asc",
			},
			{
				matchScore: "desc",
			},
			{
				createdAt: "desc",
			},
		],
	});

	return {
		totalMatches: matches.length,
		matches,
	};
};

// ======================================================
// ACCEPT MATCH
// ======================================================

const acceptMatch = async (matchId: string, donorUserId: string) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},

		include: {
			user: {
				select: {
					role: true,
					isActive: true,
					deletedAt: true,
					emailVerified: true,
				},
			},
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found.");
	}

	if (donor.user.deletedAt) {
		throw new Error("Your account has been deleted.");
	}

	if (!donor.user.isActive) {
		throw new Error("Your account is inactive.");
	}

	if (!donor.user.emailVerified) {
		throw new Error("Please verify your email first.");
	}

	if (donor.user.role !== Role.DONOR) {
		throw new Error("Only donors can accept matches.");
	}

	const match = await prisma.donorMatch.findUnique({
		where: {
			id: matchId,
		},

		include: {
			request: true,
		},
	});

	if (!match) {
		throw new Error("Donor match not found.");
	}

	if (match.donorId !== donor.id) {
		throw new Error("You don't have permission to respond to this match.");
	}

	if (match.status === MatchStatus.ACCEPTED) {
		throw new Error("You have already accepted this request.");
	}

	if (
		match.status === MatchStatus.REJECTED ||
		match.status === MatchStatus.EXPIRED
	) {
		throw new Error("This donor match is no longer available.");
	}

	if (
		match.request.status === RequestStatus.CANCELLED ||
		match.request.status === RequestStatus.COMPLETED ||
		match.request.status === RequestStatus.REJECTED
	) {
		throw new Error("This blood request is no longer active.");
	}

	const updatedMatch = await prisma.donorMatch.update({
		where: {
			id: matchId,
		},

		data: {
			status: MatchStatus.ACCEPTED,
			respondedAt: new Date(),
		},

		include: {
			request: true,
			donor: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
				},
			},
		},
	});

	// Notify requester
	await prisma.notification.create({
		data: {
			userId: match.request.requesterId,
			title: "Donor Accepted Your Request",
			message: `A compatible donor has accepted your blood request at ${match.request.hospitalName}.`,

			type: NotificationType.DONOR_ACCEPTED,
		},
	});

	// Update request status
	await prisma.bloodRequest.update({
		where: {
			id: match.requestId,
		},

		data: {
			status: RequestStatus.DONOR_FOUND,
		},
	});

	return {
		message: "Blood request accepted successfully.",
		match: updatedMatch,
	};
};

// ======================================================
// REJECT MATCH
// ======================================================

const rejectMatch = async (matchId: string, donorUserId: string) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},

		include: {
			user: {
				select: {
					role: true,
					isActive: true,
					deletedAt: true,
					emailVerified: true,
				},
			},
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found.");
	}

	if (donor.user.deletedAt) {
		throw new Error("Your account has been deleted.");
	}

	if (!donor.user.isActive) {
		throw new Error("Your account is inactive.");
	}

	if (!donor.user.emailVerified) {
		throw new Error("Please verify your email first.");
	}

	if (donor.user.role !== Role.DONOR) {
		throw new Error("Only donors can reject matches.");
	}

	const match = await prisma.donorMatch.findUnique({
		where: {
			id: matchId,
		},
	});

	if (!match) {
		throw new Error("Donor match not found.");
	}

	if (match.donorId !== donor.id) {
		throw new Error("You don't have permission to reject this match.");
	}

	if (match.status === MatchStatus.ACCEPTED) {
		throw new Error("You cannot reject an already accepted match.");
	}

	if (match.status === MatchStatus.REJECTED) {
		throw new Error("You have already rejected this match.");
	}

	const updatedMatch = await prisma.donorMatch.update({
		where: {
			id: matchId,
		},

		data: {
			status: MatchStatus.REJECTED,
			respondedAt: new Date(),
		},

		include: {
			request: true,
			donor: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
						},
					},
				},
			},
		},
	});

	return {
		message: "Blood request rejected successfully.",
		match: updatedMatch,
	};
};

export const DonorMatchService = {
	matchDonors,
	getMatchesForRequest,
	getMyMatches,
	acceptMatch,
	rejectMatch,
};
