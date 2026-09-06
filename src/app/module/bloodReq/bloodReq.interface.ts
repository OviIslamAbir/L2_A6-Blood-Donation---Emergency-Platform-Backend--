import type { BloodGroup, Urgency } from "../../../generated/prisma/enums";

export interface ICreateBloodRequestPayload {
	patientName: string;

	bloodGroup: BloodGroup;

	units: number;

	hospitalName: string;
	hospitalAddress: string;

	division?: string;
	district?: string;

	latitude?: number;
	longitude?: number;

	urgency?: Urgency;

	neededAt?: string | Date;

	reason?: string;
}

export interface IUpdateBloodRequestPayload {
	patientName?: string;

	bloodGroup?: BloodGroup;

	units?: number;

	hospitalName?: string;
	hospitalAddress?: string;

	division?: string;
	district?: string;

	latitude?: number;
	longitude?: number;

	urgency?: Urgency;

	neededAt?: string | Date;

	reason?: string;
}
