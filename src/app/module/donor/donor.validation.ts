import z from "zod";

// ======================================================
// UPDATE DONOR PROFILE
// ======================================================

const updateDonorProfileSchema = z
	.object({
		bloodGroup: z
			.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
			.optional(),

		dateOfBirth: z.string().trim().optional(),

		division: z
			.string()
			.trim()
			.min(2, "Division must be at least 2 characters.")
			.max(100, "Division cannot exceed 100 characters.")
			.optional(),

		district: z
			.string()
			.trim()
			.min(2, "District must be at least 2 characters.")
			.max(100, "District cannot exceed 100 characters.")
			.optional(),

		address: z
			.string()
			.trim()
			.min(3, "Address must be at least 3 characters.")
			.max(500, "Address cannot exceed 500 characters.")
			.optional(),

		latitude: z
			.number()
			.min(-90, "Invalid latitude.")
			.max(90, "Invalid latitude.")
			.optional(),

		longitude: z
			.number()
			.min(-180, "Invalid longitude.")
			.max(180, "Invalid longitude.")
			.optional(),
	})

	.refine(
		(data) => {
			if (!data.dateOfBirth) return true;

			const date = new Date(data.dateOfBirth);

			return !Number.isNaN(date.getTime());
		},
		{
			message: "Invalid date of birth.",
			path: ["dateOfBirth"],
		},
	);

// ======================================================
// EXPORT
// ======================================================

export const donorValidation = {
	updateDonorProfileSchema,
};
