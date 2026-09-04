import { BloodGroup, Role } from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";

import type { IDonorProfileUpdatePayload } from "./donor.interface";

// ======================================================
// BLOOD GROUP MAP
// ======================================================

const bloodGroupMap: Record<string, BloodGroup> = {
	"A+": BloodGroup.A_POSITIVE,
	"A-": BloodGroup.A_NEGATIVE,

	"B+": BloodGroup.B_POSITIVE,
	"B-": BloodGroup.B_NEGATIVE,

	"AB+": BloodGroup.AB_POSITIVE,
	"AB-": BloodGroup.AB_NEGATIVE,

	"O+": BloodGroup.O_POSITIVE,
	"O-": BloodGroup.O_NEGATIVE,
};

// ======================================================
// GET DONOR PROFILE
// ======================================================

const getDonorProfile = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},

		include: {
			donorProfile: true,
		},

		omit: {
			password: true,
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

	if (user.role !== Role.DONOR) {
		throw new Error("Only approved donors can access donor profile.");
	}

	if (!user.donorProfile) {
		throw new Error("Donor profile not found.");
	}

	return user;
};

// ======================================================
// GET DONOR APPLICATION STATUS
// ======================================================

const getDonorApplicationStatus = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},

		include: {
			donorProfile: true,
		},

		omit: {
			password: true,
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

	return {
		role: user.role,
		applicationStatus: user.donorApplicationStatus,
		donorProfile: user.donorProfile,
	};
};

// ======================================================
// UPDATE DONOR PROFILE
// ======================================================

const updateDonorProfile = async (
	userId: string,
	payload: IDonorProfileUpdatePayload,
) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},

		include: {
			donorProfile: true,
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

	if (user.role !== Role.DONOR) {
		throw new Error("Only approved donors can update donor profile.");
	}

	if (!user.donorProfile) {
		throw new Error("Donor profile not found.");
	}

	// ==================================================
	// BLOOD GROUP
	// ==================================================

	let bloodGroup: BloodGroup | undefined;

	if (payload.bloodGroup !== undefined) {
		bloodGroup = bloodGroupMap[payload.bloodGroup];

		if (!bloodGroup) {
			throw new Error("Invalid blood group.");
		}
	}

	// ==================================================
	// DATE OF BIRTH
	// ==================================================

	let dateOfBirth: Date | undefined;

	if (payload.dateOfBirth !== undefined) {
		const parsedDate = new Date(payload.dateOfBirth);

		if (Number.isNaN(parsedDate.getTime())) {
			throw new Error("Invalid date of birth.");
		}

		dateOfBirth = parsedDate;
	}

	// ==================================================
	// UPDATE DONOR PROFILE
	// ==================================================

	const donorProfile = await prisma.donorProfile.update({
		where: {
			userId,
		},

		data: {
			...(bloodGroup !== undefined && {
				bloodGroup,
			}),

			...(dateOfBirth !== undefined && {
				dateOfBirth,
			}),

			...(payload.division !== undefined && {
				division: payload.division.trim(),
			}),

			...(payload.district !== undefined && {
				district: payload.district.trim(),
			}),

			...(payload.address !== undefined && {
				address: payload.address.trim(),
			}),

			...(payload.latitude !== undefined && {
				latitude: payload.latitude,
			}),

			...(payload.longitude !== undefined && {
				longitude: payload.longitude,
			}),
		},
	});

	return {
		message: "Donor profile updated successfully.",
		donorProfile,
	};
};

// ======================================================
// EXPORT
// ======================================================

export const DonorService = {
	getDonorProfile,
	getDonorApplicationStatus,
	updateDonorProfile,
};
