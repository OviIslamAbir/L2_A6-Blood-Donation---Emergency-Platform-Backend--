import {
	DonationStatus,
	MatchStatus,
	NotificationType,
	RequestStatus,
	Role,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type {
	ICreateDonationPayload,
	IUpdateDonationPayload,
} from "./donation.interface";

const createDonation = async (
	donorUserId: string,
	payload: ICreateDonationPayload,
) => {
	const { requestId, notes } = payload;

	// Check donor
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},
		include: {
			user: true,
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
		throw new Error("Only donors can create donations.");
	}

	// Check accepted match
	const match = await prisma.donorMatch.findFirst({
		where: {
			donorId: donor.id,
			requestId,
			status: MatchStatus.ACCEPTED,
		},
		include: {
			request: true,
		},
	});

	if (!match) {
		throw new Error(
			"You can only create a donation for an accepted blood request.",
		);
	}

	if (match.request.status === RequestStatus.COMPLETED) {
		throw new Error("This blood request has already been completed.");
	}

	if (match.request.status === RequestStatus.CANCELLED) {
		throw new Error("This blood request has been cancelled.");
	}

	if (match.request.status === RequestStatus.REJECTED) {
		throw new Error("This blood request has been rejected.");
	}

	// Prevent duplicate donation
	const existingDonation = await prisma.donation.findUnique({
		where: {
			donorId_requestId: {
				donorId: donor.id,
				requestId,
			},
		},
	});

	if (existingDonation) {
		throw new Error("Donation already exists for this blood request.");
	}

	const donation = await prisma.$transaction(async (tx) => {
		const createdDonation = await tx.donation.create({
			data: {
				donorId: donor.id,
				requestId,
				status: DonationStatus.SCHEDULED,
				notes: notes?.trim() || null,
			},
			include: {
				donor: {
					select: {
						id: true,
						bloodGroup: true,
						district: true,
						division: true,
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
				request: {
					select: {
						id: true,
						patientName: true,
						bloodGroup: true,
						units: true,
						hospitalName: true,
						hospitalAddress: true,
						urgency: true,
						status: true,
						neededAt: true,
					},
				},
			},
		});

		await tx.bloodRequest.update({
			where: {
				id: requestId,
			},
			data: {
				status: RequestStatus.IN_PROGRESS,
			},
		});

		return createdDonation;
	});

	return donation;
};

const getMyDonations = async (donorUserId: string) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found.");
	}

	const donations = await prisma.donation.findMany({
		where: {
			donorId: donor.id,
		},
		orderBy: {
			createdAt: "desc",
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
				},
			},
		},
	});

	return donations;
};

const getSingleDonation = async (donationId: string, userId: string) => {
	const donation = await prisma.donation.findUnique({
		where: {
			id: donationId,
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
							role: true,
						},
					},
				},
			},
			request: {
				include: {
					requester: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
							role: true,
						},
					},
				},
			},
		},
	});

	if (!donation) {
		throw new Error("Donation not found.");
	}

	const isDonor = donation.donor.userId === userId;
	const isRequester = donation.request.requesterId === userId;

	if (!isDonor && !isRequester) {
		throw new Error(
			"Forbidden. You don't have permission to view this donation.",
		);
	}

	return donation;
};

const completeDonation = async (
	donationId: string,
	donorUserId: string,
	payload: IUpdateDonationPayload,
) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found.");
	}

	const donation = await prisma.donation.findUnique({
		where: {
			id: donationId,
		},
		include: {
			request: true,
		},
	});

	if (!donation) {
		throw new Error("Donation not found.");
	}

	if (donation.donorId !== donor.id) {
		throw new Error("Forbidden. This donation does not belong to you.");
	}

	if (donation.status === DonationStatus.COMPLETED) {
		throw new Error("Donation has already been completed.");
	}

	if (donation.status === DonationStatus.CANCELLED) {
		throw new Error("Cancelled donation cannot be completed.");
	}

	const result = await prisma.$transaction(async (tx) => {
		const completedDonation = await tx.donation.update({
			where: {
				id: donationId,
			},
			data: {
				status: DonationStatus.COMPLETED,
				donatedAt: new Date(),
				notes:
					payload.notes !== undefined
						? payload.notes.trim() || null
						: donation.notes,
			},
			include: {
				donor: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
				request: true,
			},
		});

		// Update donor statistics
		await tx.donorProfile.update({
			where: {
				id: donor.id,
			},
			data: {
				lastDonationAt: new Date(),
				totalDonations: {
					increment: 1,
				},
				isAvailable: true,
			},
		});

		// Complete blood request
		await tx.bloodRequest.update({
			where: {
				id: donation.requestId,
			},
			data: {
				status: RequestStatus.COMPLETED,
				completedAt: new Date(),
			},
		});

		// Notify requester
		await tx.notification.create({
			data: {
				userId: donation.request.requesterId,
				title: "Blood Donation Completed",
				message: `The blood donation for ${donation.request.patientName} at ${donation.request.hospitalName} has been completed successfully.`,
				type: NotificationType.REQUEST_COMPLETED,
			},
		});

		return completedDonation;
	});

	return result;
};

const cancelDonation = async (donationId: string, donorUserId: string) => {
	const donor = await prisma.donorProfile.findUnique({
		where: {
			userId: donorUserId,
		},
	});

	if (!donor) {
		throw new Error("Donor profile not found.");
	}

	const donation = await prisma.donation.findUnique({
		where: {
			id: donationId,
		},
		include: {
			request: true,
		},
	});

	if (!donation) {
		throw new Error("Donation not found.");
	}

	if (donation.donorId !== donor.id) {
		throw new Error("Forbidden. This donation does not belong to you.");
	}

	if (donation.status === DonationStatus.COMPLETED) {
		throw new Error("Completed donation cannot be cancelled.");
	}

	if (donation.status === DonationStatus.CANCELLED) {
		throw new Error("Donation is already cancelled.");
	}

	const result = await prisma.$transaction(async (tx) => {
		const cancelledDonation = await tx.donation.update({
			where: {
				id: donationId,
			},
			data: {
				status: DonationStatus.CANCELLED,
			},
		});

		// Put request back to DONOR_FOUND
		if (donation.request.status === RequestStatus.IN_PROGRESS) {
			await tx.bloodRequest.update({
				where: {
					id: donation.requestId,
				},
				data: {
					status: RequestStatus.DONOR_FOUND,
				},
			});
		}

		return cancelledDonation;
	});

	return result;
};

export const DonationService = {
	createDonation,
	getMyDonations,
	getSingleDonation,
	completeDonation,
	cancelDonation,
};
