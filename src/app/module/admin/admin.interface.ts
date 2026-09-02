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
	page?: number;
	limit?: number;
}

export interface IUpdateUserStatusPayload {
	userId: string;
	adminId: string;
	isActive: boolean;
}
