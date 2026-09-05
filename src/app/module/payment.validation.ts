import { z } from "zod";

const createPaymentSchema = z.object({
	body: z.object({
		requestId: z.string().uuid("Invalid request ID."),

		amount: z
			.number()
			.positive("Amount must be greater than 0."),

		provider: z.enum(["STRIPE", "BKASH"]),
	}),
});

const bkashExecuteSchema = z.object({
	body: z.object({
		paymentId: z.string().uuid("Invalid payment ID."),

		bkashPaymentId: z
			.string()
			.min(1, "bKash payment ID is required."),
	}),
});

export const paymentValidation = {
	createPaymentSchema,
	bkashExecuteSchema,
};