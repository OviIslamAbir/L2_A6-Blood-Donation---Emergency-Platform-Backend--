import { Router } from "express";

;

import { PaymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";
import { auth } from "../middleware/checkAuth";
import { Role } from "../../generated/prisma/browser";
import { validateRequest } from "../middleware/validateRequest";

const router = Router();

// ======================================================
// STRIPE WEBHOOK
// ======================================================

// IMPORTANT:
// This route must receive RAW body.
// Do NOT let express.json() parse this request first.

router.post(
	"/stripe/webhook",
	PaymentController.stripeWebhook,
);

// ======================================================
// CREATE PAYMENT
// ======================================================

router.post(
	"/create",
	auth(Role.REQUESTER),
	validateRequest(
		paymentValidation.createPaymentSchema,
	),
	PaymentController.createPayment,
);

// ======================================================
// BKASH EXECUTE
// ======================================================

router.post(
	"/bkash/execute",
	auth(Role.REQUESTER),
	validateRequest(
		paymentValidation.bkashExecuteSchema,
	),
	PaymentController.executeBkashPayment,
);

// ======================================================
// PAYMENT SUCCESS
// ======================================================

router.get(
	"/payment-success",
	(req, res) => {
		const clientUrl =
			"http://localhost:3000";

		res.redirect(
			`${clientUrl}/dashboard/requester/payments?payment=success`,
		);
	},
);

// ======================================================
// PAYMENT CANCEL
// ======================================================

router.get(
	"/payment-cancel",
	(req, res) => {
		const clientUrl =
			"http://localhost:3000";

		res.redirect(
			`${clientUrl}/dashboard/requester/payments?payment=cancelled`,
		);
	},
);

// ======================================================
// MY PAYMENTS
// ======================================================

router.get(
	"/my-payments",
	auth(Role.REQUESTER),
	PaymentController.getMyPayments,
);

// ======================================================
// SINGLE PAYMENT
// ======================================================

router.get(
	"/:paymentId",
	auth(Role.REQUESTER),
	PaymentController.getSinglePayment,
);

export const PaymentRoutes = router;