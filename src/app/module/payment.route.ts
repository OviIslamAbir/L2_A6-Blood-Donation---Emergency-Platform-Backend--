import { Router } from "express";

import { PaymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";

import { auth } from "../middleware/checkAuth";
import { validateRequest } from "../middleware/validateRequest";

import { Role } from "../../generated/prisma/enums";

const router = Router();

// ======================================================
// STRIPE WEBHOOK
// ======================================================

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
// BKASH CALLBACK
//
// Public route.
// bKash redirects the customer here after checkout.
// ======================================================

router.get(
	"/bkash/callback",
	PaymentController.bkashCallback,
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
// STRIPE SUCCESS
// ======================================================

router.get(
	"/payment-success",
	(req, res) => {
		const clientUrl =
			process.env.FRONTEND_URL ||
			"http://localhost:3000";

		const paymentId =
			req.query.paymentId as
				| string
				| undefined;

		const params =
			new URLSearchParams({
				payment: "success",

				...(paymentId
					? { paymentId }
					: {}),
			});

		res.redirect(
			`${clientUrl}/dashboard/requester/payments?${params.toString()}`,
		);
	},
);

// ======================================================
// STRIPE CANCEL
// ======================================================

router.get(
	"/payment-cancel",
	(req, res) => {
		const clientUrl =
			process.env.FRONTEND_URL ||
			"http://localhost:3000";

		const paymentId =
			req.query.paymentId as
				| string
				| undefined;

		const params =
			new URLSearchParams({
				payment: "cancelled",

				...(paymentId
					? { paymentId }
					: {}),
			});

		res.redirect(
			`${clientUrl}/dashboard/requester/payments?${params.toString()}`,
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