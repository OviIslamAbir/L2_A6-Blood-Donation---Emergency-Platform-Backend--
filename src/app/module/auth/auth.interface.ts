import type { BloodGroup, Role } from "../../../generated/prisma/browser";

// ======================================================
// LOGIN
// ======================================================

export interface ILoginUserPayload {
	email: string;
	password: string;
}

// ======================================================
// REGISTER
// ======================================================

export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
}

// ======================================================
// VERIFY EMAIL
// ======================================================

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

// ======================================================
// REQUEST USER
// JWT USER
// ======================================================

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

// ======================================================
// GOOGLE LOGIN
// ======================================================

export interface IGoogleLoginPayload {
	idToken: string;
}

// ======================================================
// FORGOT PASSWORD
// ======================================================

export interface IForgotPasswordPayload {
	email: string;
}

// ======================================================
// RESET PASSWORD
// ======================================================

export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}

// ======================================================
// DONOR APPLICATION
// ======================================================

export interface IDonorApplicationPayload {
	userId: string;

	bloodGroup: BloodGroup;

	dateOfBirth?: string;

	division?: string;

	district?: string;

	address?: string;

	latitude?: number;

	longitude?: number;
}
