export interface ICreateBloodRequestPayload {
	patientName: string;
	bloodGroup: string;
	units: number;
	hospitalName: string;
	hospitalAddress: string;
	division?: string;
	district?: string;
	latitude?: number;
	longitude?: number;
	urgency?: string;
	neededAt?: string;
	reason?: string;
}

export interface IUpdateBloodRequestPayload {
	patientName?: string;
	bloodGroup?: string;
	units?: number;
	hospitalName?: string;
	hospitalAddress?: string;
	division?: string;
	district?: string;
	latitude?: number;
	longitude?: number;
	urgency?: string;
	neededAt?: string;
	reason?: string;
}