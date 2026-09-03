// ======================================================
// REQUESTER TYPE
// ======================================================

export type RequesterType = "PATIENT" | "HOSPITAL";

// ======================================================
// REGISTER USER
// ======================================================

export interface IRegisterUserPayload {
	name: string;
	email: string;
	password: string;
	requesterType: RequesterType;
}

// ======================================================
// VERIFY EMAIL
// ======================================================

export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}

// ======================================================
// LOGIN
// ======================================================

export interface ILoginUserPayload {
	email: string;
	password: string;
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
	bloodGroup: string;
	dateOfBirth?: string;
	division: string;
	district: string;
	address: string;
	latitude?: number;
	longitude?: number;
}

// ======================================================
// REQUEST USER
// ======================================================

export interface IRequestUser {
	userId: string;
	name: string;
	email: string;
	role: string;
}
