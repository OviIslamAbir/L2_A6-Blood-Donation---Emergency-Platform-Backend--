import { z } from "zod";

const createPaymentSchema = z.object({
	body: z.object({
		requestId: z.string().uuid("Invalid request ID."),

		amount: z
			.number()
			.positive("Amount must be greater than 0.")
			.max(1_000_000, "Amount is too large."),

		provider: z.enum(["STRIPE", "BKASH"]),
	}),
});

const bkashExecuteSchema = z.object({
	body: z.object({
		paymentId: z.string().uuid("Invalid payment ID."),

		bkashPaymentId: z
			.string()
			.trim()
			.min(1, "bKash payment ID is required.")
			.max(100, "Invalid bKash payment ID."),
	}),
});

export const paymentValidation = {
	createPaymentSchema,
	bkashExecuteSchema,
};