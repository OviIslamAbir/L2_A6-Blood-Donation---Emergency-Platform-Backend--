import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { DonorMatchController } from "./donorMatch.controller";

const router = Router();

// ======================================================
// REQUESTER
// ======================================================

// Find compatible donors for a blood request
router.post(
	"/:requestId/match",
	auth(Role.REQUESTER),
	DonorMatchController.matchDonors,
);

// Get all donor matches for a request
router.get(
	"/:requestId",
	auth(Role.REQUESTER),
	DonorMatchController.getMatchesForRequest,
);

// ======================================================
// DONOR
// ======================================================

// Get my blood request matches
router.get("/my-matches", auth(Role.DONOR), DonorMatchController.getMyMatches);

// Accept a donor match
router.patch(
	"/:matchId/accept",
	auth(Role.DONOR),
	DonorMatchController.acceptMatch,
);

// Reject a donor match
router.patch(
	"/:matchId/reject",
	auth(Role.DONOR),
	DonorMatchController.rejectMatch,
);

export const DonorMatchRoutes = router;
