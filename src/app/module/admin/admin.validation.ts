import z from "zod";

const rejectDonorSchema = z.object({
	reason: z
		.string()
		.max(500, "Reason cannot exceed 500 characters.")
		.optional(),
});


const updateUserStatusSchema = z.object({
	isActive: z.boolean(),
});


export const adminValidation = {
	rejectDonorSchema,
	updateUserStatusSchema,
};