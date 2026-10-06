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
import { PaymentRoutes } from "./app/module/payment/payment.route";
import { AuditLogRoutes } from "./app/module/auditLog/auditLog.route";

const app: Application = express();

// ======================================================
// CORS (FIXED FOR LOCALHOST & PRODUCTION)
// ======================================================

const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	config.bak_url, // .env e jodi kono frontend url thake
].filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			// Postman or Mobile Request e origin undefined thake, so oita allow kora hocche
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("CORS policy error: Origin not allowed"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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

app.use("/api/v1/donors", DonorRoutes);

app.use("/api/v1/blood-requests", BloodRequestRoutes);

app.use("/api/v1/donor-matches", DonorMatchRoutes);

app.use("/api/v1/notifications", NotificationRoutes);

app.use("/api/v1/donations", DonationRoutes);

app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/audit-logs", AuditLogRoutes);

// ======================================================
// BASIC ROUTE
// ======================================================

app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Blood Donation & Emergency Assistance Platform",
	});
});

// ======================================================
// ERROR HANDLERS
// ======================================================

app.use(globalErrorHandler);

app.use(notFound);

export default app;