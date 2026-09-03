import z from "zod";

import { BloodGroup, Urgency } from "../../../generated/prisma/enums";

// ======================================================
// ENUM HELPERS
// ======================================================

const bloodGroupValues = Object.values(BloodGroup) as [
	BloodGroup,
	...BloodGroup[],
];

const urgencyValues = Object.values(Urgency) as [Urgency, ...Urgency[]];

// ======================================================
// CREATE BLOOD REQUEST
// ======================================================

const createBloodRequestSchema = z.object({
	patientName: z
		.string()
		.trim()
		.min(2, "Patient name is required.")
		.max(100, "Patient name cannot exceed 100 characters."),

	bloodGroup: z.enum(bloodGroupValues),

	units: z
		.number()
		.int("Units must be a whole number.")
		.min(1, "At least 1 unit is required.")
		.max(20, "Maximum 20 units are allowed."),

	hospitalName: z
		.string()
		.trim()
		.min(2, "Hospital name is required.")
		.max(200, "Hospital name cannot exceed 200 characters."),

	hospitalAddress: z
		.string()
		.trim()
		.min(5, "Hospital address is required.")
		.max(500, "Hospital address cannot exceed 500 characters."),

	division: z
		.string()
		.trim()
		.min(2, "Division must contain at least 2 characters.")
		.max(100, "Division cannot exceed 100 characters.")
		.optional(),

	district: z
		.string()
		.trim()
		.min(2, "District must contain at least 2 characters.")
		.max(100, "District cannot exceed 100 characters.")
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

	urgency: z.enum(urgencyValues).optional(),

	neededAt: z.string().datetime().or(z.string().date()).optional(),

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
		.min(2, "Patient name is required.")
		.max(100, "Patient name cannot exceed 100 characters.")
		.optional(),

	bloodGroup: z.enum(bloodGroupValues).optional(),

	units: z
		.number()
		.int("Units must be a whole number.")
		.min(1, "At least 1 unit is required.")
		.max(20, "Maximum 20 units are allowed.")
		.optional(),

	hospitalName: z
		.string()
		.trim()
		.min(2, "Hospital name is required.")
		.max(200, "Hospital name cannot exceed 200 characters.")
		.optional(),

	hospitalAddress: z
		.string()
		.trim()
		.min(5, "Hospital address is required.")
		.max(500, "Hospital address cannot exceed 500 characters.")
		.optional(),

	division: z
		.string()
		.trim()
		.min(2, "Division must contain at least 2 characters.")
		.max(100, "Division cannot exceed 100 characters.")
		.optional(),

	district: z
		.string()
		.trim()
		.min(2, "District must contain at least 2 characters.")
		.max(100, "District cannot exceed 100 characters.")
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

	urgency: z.enum(urgencyValues).optional(),

	neededAt: z.string().datetime().or(z.string().date()).optional(),

	reason: z
		.string()
		.trim()
		.max(1000, "Reason cannot exceed 1000 characters.")
		.optional(),
});

// ======================================================
// EXPORT
// ======================================================

export const bloodRequestValidation = {
	createBloodRequestSchema,
	updateBloodRequestSchema,
};
