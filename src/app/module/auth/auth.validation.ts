import z from "zod";

// ======================================================
// BLOOD GROUP
// ======================================================

const bloodGroupSchema = z.enum([
	"A+",
	"A-",
	"B+",
	"B-",
	"AB+",
	"AB-",
	"O+",
	"O-",
]);

// ======================================================
// REQUESTER TYPE
// ======================================================

const requesterTypeSchema = z.enum(["PATIENT", "HOSPITAL"], {
	message: "Requester type must be either PATIENT or HOSPITAL",
});

// ======================================================
// REGISTER USER
// Always creates REQUESTER
// ======================================================

const registerUserSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, {
			message: "Name must be at least 3 characters long",
		})
		.max(50, {
			message: "Name cannot exceed 50 characters",
		}),

	email: z.email({
		message: "Please provide a valid email address",
	}),

	password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(32, {
			message: "Password cannot exceed 32 characters",
		})
		.regex(/[A-Z]/, {
			message: "Password must contain at least one uppercase letter",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least one lowercase letter",
		})
		.regex(/[0-9]/, {
			message: "Password must contain at least one number",
		})
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least one special character",
		}),

	// ==================================================
	// PATIENT / HOSPITAL
	// ==================================================

	requesterType: requesterTypeSchema,
});

// ======================================================
// VERIFY EMAIL
// ======================================================

const verifyEmailSchema = z.object({
	email: z.email({
		message: "Please provide a valid email address",
	}),

	otp: z
		.string()
		.length(6, {
			message: "OTP must be exactly 6 digits",
		})
		.regex(/^[0-9]+$/, {
			message: "OTP must contain only numbers",
		}),
});

// ======================================================
// LOGIN
// ======================================================

const loginUserSchema = z.object({
	email: z.email({
		message: "Please provide a valid email address",
	}),

	password: z
		.string()
		.min(8, {
			message: "Password must be at least 8 characters long",
		})
		.max(32, {
			message: "Password cannot exceed 32 characters",
		}),
});

// ======================================================
// GOOGLE LOGIN
// ======================================================

const googleLoginSchema = z.object({
	idToken: z.string().trim().min(1, {
		message: "Google ID token is required",
	}),
});

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPasswordSchema = z.object({
	email: z.email({
		message: "Please provide a valid email address",
	}),
});

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPasswordSchema = z.object({
	email: z.email({
		message: "Please provide a valid email address",
	}),

	otp: z
		.string()
		.length(6, {
			message: "OTP must be exactly 6 digits",
		})
		.regex(/^[0-9]+$/, {
			message: "OTP must contain only numbers",
		}),

	newPassword: z
		.string()
		.min(8, {
			message: "Password must be minimum 8 characters long",
		})
		.max(32, {
			message: "Password cannot exceed 32 characters",
		})
		.regex(/[a-z]/, {
			message: "Password must contain at least 1 lowercase letter",
		})
		.regex(/[A-Z]/, {
			message: "Password must contain at least 1 uppercase letter",
		})
		.regex(/[0-9]/, {
			message: "Password must contain at least 1 number",
		})
		.regex(/[^A-Za-z0-9]/, {
			message: "Password must contain at least 1 special character",
		}),
});

// ======================================================
// DONOR APPLICATION
// ======================================================

const donorApplicationSchema = z.object({
	bloodGroup: bloodGroupSchema,

	dateOfBirth: z.string().optional(),

	division: z
		.string()
		.trim()
		.min(2, {
			message: "Division is required",
		})
		.max(100, {
			message: "Division cannot exceed 100 characters",
		}),

	district: z
		.string()
		.trim()
		.min(2, {
			message: "District is required",
		})
		.max(100, {
			message: "District cannot exceed 100 characters",
		}),

	address: z
		.string()
		.trim()
		.min(3, {
			message: "Address is required",
		})
		.max(500, {
			message: "Address cannot exceed 500 characters",
		}),

	latitude: z
		.number()
		.min(-90, {
			message: "Latitude must be between -90 and 90",
		})
		.max(90, {
			message: "Latitude must be between -90 and 90",
		})
		.optional(),

	longitude: z
		.number()
		.min(-180, {
			message: "Longitude must be between -180 and 180",
		})
		.max(180, {
			message: "Longitude must be between -180 and 180",
		})
		.optional(),
});

// ======================================================
// EXPORT
// ======================================================

export const userValidation = {
	registerUserSchema,
	verifyEmailSchema,
	loginUserSchema,
	googleLoginSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	donorApplicationSchema,
};
