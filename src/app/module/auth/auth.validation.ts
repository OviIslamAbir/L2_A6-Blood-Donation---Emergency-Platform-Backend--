import z from "zod";

const PatientRegistrationZodSchema = z.object({
	name: z
		.string()
		.min(3, { message: "Name must be at least 3 characters long" })
		.max(10, { message: "Name cannot exceed 10 characters" }),

	email: z.email({ message: "Please provide a valid email address" }),

	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(32, { message: "Password cannot exceed 32 characters" })
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

	patient: z
		.object({
			contactNumber: z
				.string()
				.min(11, {
					message: "Contact number must be at least 11 characters long",
				})
				.max(15, {
					message: "Contact number cannot exceed 15 characters",
				})
				.regex(/^[0-9]+$/, {
					message: "Contact number must contain only numbers",
				})
				.optional(),
		})
		.optional(),
});
const PatientEmailVerifyZodSchema = z.object({
	email: z.email({ message: "Please provide a valid email address" }),
	otp: z.string().length(6),
});

const PatientLoginZodSchema = z.object({
	email: z.email({ message: "Please provide a valid email address" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters long" })
		.max(32, { message: "Password cannot exceed 32 characters" }),
});

const ForgotPasswordZodSchema = z.object({
	email: z.email(),
});

const ResetPasswordZodSchema = z.object({
	email: z.email(),
	newPassword: z
		.string()
		.min(8, "Password Must Minimum 8 Characters Long.")
		.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
		.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")

		.regex(/[0-9]/, "Password must contain atleast 1 Number")
		.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character"),
	otp: z.string().length(6),
});

export const userValidation = {
	PatientRegistrationZodSchema,
	PatientLoginZodSchema,
	ForgotPasswordZodSchema,
	ResetPasswordZodSchema,
	PatientEmailVerifyZodSchema,
};
