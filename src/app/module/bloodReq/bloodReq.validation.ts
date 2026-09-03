import z from "zod";

import {
	BloodGroup,
	Urgency,
} from "../../../generated/prisma/enums";

// ======================================================
// CREATE BLOOD REQUEST
// ======================================================

const createBloodRequestSchema = z.object({
	patientName: z
		.string()
		.trim()
		.min(2, "Patient name is required."),

	bloodGroup: z
		.enum(
			Object.values(BloodGroup) as [
				BloodGroup,
				...BloodGroup[],
			],
		),

	units: z
		.number()
		.int("Units must be a whole number.")
		.min(1, "At least 1 unit is required.")
		.max(20, "Maximum 20 units are allowed."),

	hospitalName: z
		.string()
		.trim()
		.min(2, "Hospital name is required."),

	hospitalAddress: z
		.string()
		.trim()
		.min(5, "Hospital address is required."),

	division: z
		.string()
		.trim()
		.min(2, "Division must contain at least 2 characters.")
		.optional(),

	district: z
		.string()
		.trim()
		.min(2, "District must contain at least 2 characters.")
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

	urgency: z
		.enum(
			Object.values(Urgency) as [
				Urgency,
				...Urgency[],
			],
		)
		.optional(),

	neededAt: z
		.string()
		.datetime()
		.or(z.string().date())
		.optional(),

	reason: z
		.string()
		.trim()
		.max(1000, "Reason cannot exceed 1000 characters.")
		.optional(),
});

// ======================================================
// UPDATE BLOOD REQUEST
// ======================================================

const updateBloodRequestSchema = z.object({
	patientName: z
		.string()
		.trim()
		.min(2)
		.optional(),

	bloodGroup: z
		.enum(
			Object.values(BloodGroup) as [
				BloodGroup,
				...BloodGroup[],
			],
		)
		.optional(),

	units: z
		.number()
		.int("Units must be a whole number.")
		.min(1)
		.max(20)
		.optional(),

	hospitalName: z
		.string()
		.trim()
		.min(2)
		.optional(),

	hospitalAddress: z
		.string()
		.trim()
		.min(5)
		.optional(),

	division: z
		.string()
		.trim()
		.min(2)
		.optional(),

	district: z
		.string()
		.trim()
		.min(2)
		.optional(),

	latitude: z
		.number()
		.min(-90)
		.max(90)
		.optional(),

	longitude: z
		.number()
		.min(-180)
		.max(180)
		.optional(),

	urgency: z
		.enum(
			Object.values(Urgency) as [
				Urgency,
				...Urgency[],
			],
		)
		.optional(),

	neededAt: z
		.string()
		.datetime()
		.or(z.string().date())
		.optional(),

	reason: z
		.string()
		.trim()
		.max(1000)
		.optional(),
});

export const bloodRequestValidation = {
	createBloodRequestSchema,
	updateBloodRequestSchema,
};