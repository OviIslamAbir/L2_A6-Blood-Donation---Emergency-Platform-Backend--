export interface IApproveDonorPayload {
	userId: string;
	adminId: string;
}

export interface IRejectDonorPayload {
	userId: string;
	adminId: string;
	reason?: string;
}

export interface IGetUsersQuery {
	search?: string;
	role?: string;
	isActive?: string;
	page?: string | number;
	limit?: string | number;
}

export interface IUpdateUserStatusPayload {
	userId: string;
	adminId: string;
	isActive: boolean;
}

export interface IDeleteUserPayload {
	userId: string;
	adminId: string;
}
export interface IVerifyBloodRequestPayload {
	requestId: string;
	adminId: string;
}
