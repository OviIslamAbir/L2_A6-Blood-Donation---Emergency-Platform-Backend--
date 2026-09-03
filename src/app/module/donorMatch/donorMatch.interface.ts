import type { MatchStatus } from "../../../generated/prisma/enums";

export interface IDonorMatchResponse {
	id: string;
	requestId: string;
	donorId: string;
	distanceKm: number | null;
	matchScore: number | null;
	status: MatchStatus;
	notifiedAt: Date | null;
	respondedAt: Date | null;
	createdAt: Date;
}

export interface IMatchDonorsResponse {
	message: string;
	totalMatches: number;
	matches: IDonorMatchResponse[];
}
