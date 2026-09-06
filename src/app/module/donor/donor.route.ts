import { Router } from "express";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { DonorController } from "./donor.controller";
import { donorValidation } from "./donor.validation";

const router = Router();

// ======================================================
// DONOR PROFILE
// ======================================================

router.get("/profile", auth("DONOR"), DonorController.getDonorProfile);

// ======================================================
// APPLICATION STATUS
// ======================================================

router.get(
	"/application-status",
	auth(),
	DonorController.getDonorApplicationStatus,
);

// ======================================================
// UPDATE DONOR PROFILE
// ======================================================

router.patch(
	"/profile",
	auth("DONOR"),
	validateRequest(donorValidation.updateDonorProfileSchema),
	DonorController.updateDonorProfile,
);

export const DonorRoutes = router;
