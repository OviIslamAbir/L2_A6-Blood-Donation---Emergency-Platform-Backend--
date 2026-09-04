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

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/admin", AdminRoutes);
app.use("/api/v1/donor", DonorRoutes);
app.use("/api/v1/blood-requests", BloodRequestRoutes);
app.use("/api/v1/donor-matches", DonorMatchRoutes);
app.use("/api/v1/notifications", NotificationRoutes);
app.use("/api/v1/donations", DonationRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH Healthcare System Backend",
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
