import { Router } from "express";

import { DonorController } from "./donor.controller";
import { donorValidation } from "./donor.validation";

import { auth } from "../../middleware/checkAuth";

import { Role } from "../../../generated/prisma/enums";


const router = Router();


// ======================================================
// DONOR PROFILE
// ======================================================

router.get(
  "/profile",
  auth(Role.DONOR),
  DonorController.getDonorProfile,
);


router.get(
  "/application-status",
  auth(Role.DONOR),
  DonorController.getDonorApplicationStatus,
);


export const DonorRoutes = router;