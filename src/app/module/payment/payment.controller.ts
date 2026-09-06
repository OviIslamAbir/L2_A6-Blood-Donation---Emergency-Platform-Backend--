import type { Request, Response } from "express";

import httpStatus from "http-status";

import { PaymentServices } from "./payment.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// ======================================================
// CREATE PAYMENT
// ======================================================

const createPayment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const result = await PaymentServices.createPayment(user.userId, req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,

		success: true,

		message: "Payment initiated successfully.",

		data: result,
	});
});

// ======================================================
// BKASH EXECUTE
// ======================================================

const executeBkashPayment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const result = await PaymentServices.executeBkashPayment(
		user.userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,

		success: true,

		message: "bKash payment completed successfully.",

		data: result,
	});
});

// ======================================================
// BKASH CALLBACK
// ======================================================
const bkashCallback = catchAsync(async (req: Request, res: Response) => {
	const paymentId = req.query.paymentId as string;

	const bkashPaymentId = (req.query.paymentID ||
		req.query.paymentIdFromBkash) as string | undefined;

	const status = req.query.status as string | undefined;

	if (!paymentId) {
		res.status(400).json({
			success: false,
			message: "Payment ID is missing",
		});
		return;
	}

	const result = await PaymentServices.bkashCallback(
		paymentId,
		bkashPaymentId,
		status,
	);

	res.status(200).json({
		success: true,
		message: "Payment callback processed",
		data: {
			payment: "bkash",
			paymentId: result.paymentId,
			bkashPaymentId: result.bkashPaymentId || "",
			status: result.status || "",
		},
	});
});
// ======================================================
// STRIPE WEBHOOK
// ======================================================

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
	const signature = req.headers["stripe-signature"];

	if (!signature || Array.isArray(signature)) {
		throw new Error("Stripe signature is missing.");
	}

	const result = await PaymentServices.stripeWebhook(req.body, signature);

	res.status(httpStatus.OK).json(result);
});

// ======================================================
// GET MY PAYMENTS
// ======================================================

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const result = await PaymentServices.getMyPayments(user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,

		success: true,

		message: "Payments retrieved successfully.",

		data: result,
	});
});

// ======================================================
// GET SINGLE PAYMENT
// ======================================================

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;

	const paymentId = req.params.paymentId as string;

	const result = await PaymentServices.getSinglePayment(paymentId, user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,

		success: true,

		message: "Payment retrieved successfully.",

		data: result,
	});
});

export const PaymentController = {
	createPayment,
	executeBkashPayment,
	bkashCallback,
	stripeWebhook,
	getMyPayments,
	getSinglePayment,
};
