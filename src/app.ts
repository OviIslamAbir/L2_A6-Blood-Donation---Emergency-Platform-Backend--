import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";

import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";

import { AuthRoutes } from "./app/module/auth/auth.route";
import { AdminRoutes } from "./app/module/admin/admin.route";
import { DonorRoutes } from "./app/module/donor/donor.route";
import { BloodRequestRoutes } from "./app/module/bloodReq/bloodReq.route";
import { DonorMatchRoutes } from "./app/module/donorMatch/donorMatch.route";
import { NotificationRoutes } from "./app/module/notification/notification.route";
import { DonationRoutes } from "./app/module/donation/donation.route";
import { PaymentRoutes } from "./app/module/payment.route";
import { AuditLogRoutes } from "./app/module/auditLog/auditLog.route";

const app: Application = express();

// ======================================================
// CORS
// ======================================================

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// ======================================================
// STRIPE WEBHOOK RAW BODY
// IMPORTANT: MUST COME BEFORE express.json()
// ======================================================

app.use(
	"/api/v1/payments/stripe/webhook",
	express.raw({
		type: "application/json",
	}),
);

// ======================================================
// BODY PARSERS
// ======================================================

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

// ======================================================
// COOKIE
// ======================================================

app.use(cookieParser());

// ======================================================
// ROUTES
// ======================================================

app.use("/api/v1/auth", AuthRoutes);

app.use("/api/v1/admin", AdminRoutes);

app.use("/api/v1/donor", DonorRoutes);

app.use("/api/v1/blood-requests", BloodRequestRoutes);

app.use("/api/v1/donor-matches", DonorMatchRoutes);

app.use("/api/v1/notifications", NotificationRoutes);

app.use("/api/v1/donations", DonationRoutes);

app.use("/api/v1/payments", PaymentRoutes);
app.use(
	"/api/v1/audit-logs",
	AuditLogRoutes,
);	

// ======================================================
// BASIC ROUTE
// ======================================================

app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH Healthcare System Backend",
	});
});

// ======================================================
// ERROR HANDLERS
// ======================================================

app.use(globalErrorHandler);

app.use(notFound);

export default app;

