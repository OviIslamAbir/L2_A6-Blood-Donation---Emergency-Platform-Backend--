import type { BloodGroup, Role } from "../../../generated/prisma/browser";

export interface ILoginUserPayload {
	email: string;
	password: string;
}

export interface IRegisterDonorPayload {
	name: string;
	email: string;
	password: string;

	donor: {
		bloodGroup: string;
		dateOfBirth?: string;
		division?: string;
		district?: string;
		address?: string;
		latitude?: number;
		longitude?: number;
	};
}

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

export interface IRequestUser {
	userId: string;
	email: string;
	name: string;
	role: Role;
}

export interface IGoogleLoginPayload {
	idToken: string;
}

export interface IForgotPasswordPayload {
	email: string;
}

export interface IResetPasswordPayload {
	email: string;
	otp: string;
	newPassword: string;
}
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
export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
}
