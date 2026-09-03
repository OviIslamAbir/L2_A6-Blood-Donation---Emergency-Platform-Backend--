import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { BloodRequestController } from "./bloodReq.controller";
import { bloodRequestValidation } from "./bloodReq.validation";

const router = Router();

// ======================================================
// CREATE BLOOD REQUEST
// ======================================================

router.post(
	"/",
	auth(Role.REQUESTER),
	validateRequest(bloodRequestValidation.createBloodRequestSchema),
	BloodRequestController.createBloodRequest,
);

// ======================================================
// GET MY BLOOD REQUESTS
// ======================================================

router.get(
	"/",
	auth(Role.REQUESTER),
	BloodRequestController.getMyBloodRequests,
);

// ======================================================
// GET SINGLE BLOOD REQUEST
// ======================================================

router.get(
	"/:requestId",
	auth(Role.REQUESTER),
	BloodRequestController.getSingleBloodRequest,
);

// ======================================================
// UPDATE BLOOD REQUEST
// ======================================================

router.patch(
	"/:requestId",
	auth(Role.REQUESTER),
	validateRequest(bloodRequestValidation.updateBloodRequestSchema),
	BloodRequestController.updateBloodRequest,
);

// ======================================================
// CANCEL BLOOD REQUEST
// ======================================================

router.delete(
	"/:requestId",
	auth(Role.REQUESTER),
	BloodRequestController.cancelBloodRequest,
);

// ======================================================
// EXPORT
// ======================================================

export const BloodRequestRoutes = router;
