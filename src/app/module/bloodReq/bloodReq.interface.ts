import type { BloodGroup, Urgency } from "../../../generated/prisma/enums";

// ======================================================
// CREATE BLOOD REQUEST
// ======================================================

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

// ======================================================
// UPDATE BLOOD REQUEST
// ======================================================

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
