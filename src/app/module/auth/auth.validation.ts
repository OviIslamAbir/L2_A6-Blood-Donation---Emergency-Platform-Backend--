import z from "zod";

// ======================================================
// REGISTER USER
// Always creates REQUESTER
// ======================================================

const registerUserSchema = z.object({
	name: z
		.string()
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
	idToken: z.string().min(1, {
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
	bloodGroup: z.string().min(1, {
		message: "Blood group is required",
	}),

	dateOfBirth: z.string().optional(),

	division: z.string().min(1, {
		message: "Division is required",
	}),

	district: z.string().min(1, {
		message: "District is required",
	}),

	address: z.string().min(1, {
		message: "Address is required",
	}),

	latitude: z.number().optional(),

	longitude: z.number().optional(),
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
