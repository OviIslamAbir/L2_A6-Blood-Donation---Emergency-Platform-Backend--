import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { DonationController } from "./donation.controller";
import { donationValidation } from "./donation.validation";

const router = Router();

router.post(
	"/",
	auth(Role.DONOR),
	validateRequest(donationValidation.createDonationSchema),
	DonationController.createDonation,
);

router.get(
	"/my-donations",
	auth(Role.DONOR),
	DonationController.getMyDonations,
);

router.get(
	"/:donationId",
	auth(Role.DONOR, Role.REQUESTER),
	DonationController.getSingleDonation,
);

router.patch(
	"/:donationId/complete",
	auth(Role.DONOR),
	validateRequest(donationValidation.updateDonationSchema),
	DonationController.completeDonation,
);

router.patch(
	"/:donationId/cancel",
	auth(Role.DONOR),
	DonationController.cancelDonation,
);

export const DonationRoutes = router;
