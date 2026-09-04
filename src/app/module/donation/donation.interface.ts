export interface ICreateDonationPayload {
	requestId: string;
	notes?: string;
}

export interface IUpdateDonationPayload {
	notes?: string;
}
