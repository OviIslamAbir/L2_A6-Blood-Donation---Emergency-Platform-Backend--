import { z } from "zod";

const createDonationSchema = z.object({
	requestId: z.string().uuid("Invalid request ID"),
	notes: z.string().trim().max(500).optional(),
});

const updateDonationSchema = z.object({
	notes: z.string().trim().max(500).optional(),
});

export const donationValidation = {
	createDonationSchema,
	updateDonationSchema,
};
