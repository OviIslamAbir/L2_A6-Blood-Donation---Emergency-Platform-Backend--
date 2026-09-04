export interface IDonorProfileUpdatePayload {
	bloodGroup?: string;
	dateOfBirth?: string;
	division?: string;
	district?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
}

export interface IDonorStatusResponse {
	applicationStatus: string;
	role: string;
	donorProfile: unknown;
}
