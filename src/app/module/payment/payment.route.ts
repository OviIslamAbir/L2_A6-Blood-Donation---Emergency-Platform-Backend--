import { Router } from "express";

import { PaymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";

import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";

import { Role } from "../../../generated/prisma/enums";
import config from "../../config";

const router = Router();

// ======================================================
// STRIPE WEBHOOK
// ======================================================

router.post("/stripe/webhook", PaymentController.stripeWebhook);

// ======================================================
// CREATE PAYMENT
// ======================================================

router.post(
	"/create",
	auth(Role.REQUESTER),
	validateRequest(paymentValidation.createPaymentSchema),
	PaymentController.createPayment,
);

// ======================================================
// BKASH CALLBACK
// ======================================================

router.get("/bkash/callback", PaymentController.bkashCallback);

// ======================================================
// BKASH EXECUTE
// ======================================================

router.post(
	"/bkash/execute",
	auth(Role.REQUESTER),
	validateRequest(paymentValidation.bkashExecuteSchema),
	PaymentController.executeBkashPayment,
);

// ======================================================
// STRIPE SUCCESS
// ======================================================

router.get("/payment-success", (req, res) => {
	const paymentId = req.query.paymentId as string | undefined;

	res.status(200).send(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Payment Successful</title>

			<style>
				* {
					box-sizing: border-box;
					margin: 0;
					padding: 0;
				}

				body {
					font-family: Arial, sans-serif;
					background: #f4f7f9;
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 20px;
				}

				.card {
					background: white;
					width: 100%;
					max-width: 500px;
					padding: 40px;
					border-radius: 16px;
					text-align: center;
					box-shadow: 0 10px 30px rgba(0,0,0,0.08);
				}

				.icon {
					width: 80px;
					height: 80px;
					margin: 0 auto 20px;
					border-radius: 50%;
					background: #e8f8ee;
					color: #16a34a;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 42px;
				}

				h1 {
					color: #16a34a;
					margin-bottom: 12px;
				}

				p {
					color: #555;
					line-height: 1.6;
					margin-bottom: 10px;
				}

				.payment-id {
					margin-top: 20px;
					padding: 12px;
					background: #f5f5f5;
					border-radius: 8px;
					font-size: 13px;
					word-break: break-all;
					color: #444;
				}

				.status {
					margin-top: 20px;
					font-weight: bold;
					color: #16a34a;
				}
			</style>
		</head>

		<body>
			<div class="card">
				<div class="icon">✓</div>

				<h1>Payment Successful!</h1>

				<p>
					Your Stripe payment has been completed successfully.
				</p>

				<p>
					Thank you for your payment.
				</p>

				${
					paymentId
						? `
							<div class="payment-id">
								<strong>Payment ID:</strong><br />
								${paymentId}
							</div>
						`
						: ""
				}

				<div class="status">
					Payment Status: PAID
				</div>
			</div>
		</body>
		</html>
	`);
});

// ======================================================
// STRIPE CANCEL
// ======================================================

router.get("/payment-cancel", (req, res) => {
	const paymentId = req.query.paymentId as string | undefined;

	res.status(200).send(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>Payment Cancelled</title>

			<style>
				* {
					box-sizing: border-box;
					margin: 0;
					padding: 0;
				}

				body {
					font-family: Arial, sans-serif;
					background: #f4f7f9;
					min-height: 100vh;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 20px;
				}

				.card {
					background: white;
					width: 100%;
					max-width: 500px;
					padding: 40px;
					border-radius: 16px;
					text-align: center;
					box-shadow: 0 10px 30px rgba(0,0,0,0.08);
				}

				.icon {
					width: 80px;
					height: 80px;
					margin: 0 auto 20px;
					border-radius: 50%;
					background: #fff4e5;
					color: #f59e0b;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 42px;
				}

				h1 {
					color: #f59e0b;
					margin-bottom: 12px;
				}

				p {
					color: #555;
					line-height: 1.6;
					margin-bottom: 10px;
				}

				.payment-id {
					margin-top: 20px;
					padding: 12px;
					background: #f5f5f5;
					border-radius: 8px;
					font-size: 13px;
					word-break: break-all;
					color: #444;
				}

				.status {
					margin-top: 20px;
					font-weight: bold;
					color: #f59e0b;
				}
			</style>
		</head>

		<body>
			<div class="card">
				<div class="icon">!</div>

				<h1>Payment Cancelled</h1>

				<p>
					Your Stripe payment was cancelled.
				</p>

				<p>
					No payment was completed.
				</p>

				${
					paymentId
						? `
							<div class="payment-id">
								<strong>Payment ID:</strong><br />
								${paymentId}
							</div>
						`
						: ""
				}

				<div class="status">
					Payment Status: CANCELLED
				</div>
			</div>
		</body>
		</html>
	`);
});

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
