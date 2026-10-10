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
// BKASH CALLBACK & EXECUTE
// ======================================================

router.get("/bkash/callback", PaymentController.bkashCallback);

router.post(
    "/bkash/execute",
    auth(Role.REQUESTER),
    validateRequest(paymentValidation.bkashExecuteSchema),
    PaymentController.executeBkashPayment,
);

// ======================================================
// STRIPE SUCCESS / CANCEL REDIRECTS TO FRONTEND
// ======================================================

router.get("/payment-success", (req, res) => {
    const paymentId = req.query.paymentId as string | undefined;
    const clientUrl = "https://blood-donation-frontend-eta.vercel.app";
    res.redirect(`${clientUrl}/requester/payments/success${paymentId ? `?paymentId=${paymentId}` : ""}`);
});

router.get("/payment-cancel", (req, res) => {
    const paymentId = req.query.paymentId as string | undefined;
    const clientUrl = "https://blood-donation-frontend-eta.vercel.app";
    res.redirect(`${clientUrl}/requester/payments/cancel${paymentId ? `?paymentId=${paymentId}` : ""}`);
});

// ======================================================
// MY PAYMENTS & SINGLE PAYMENT
// ======================================================

router.get(
    "/my-payments",
    auth(Role.REQUESTER),
    PaymentController.getMyPayments,
);

router.get(
    "/:paymentId",
    auth(Role.REQUESTER),
    PaymentController.getSinglePayment,
);

// ======================================================
// CONFIRM STRIPE PAYMENT
// ======================================================

router.post(
    "/stripe/confirm",
    auth(Role.REQUESTER),
    PaymentController.confirmStripePayment,
);

export const PaymentRoutes = router;