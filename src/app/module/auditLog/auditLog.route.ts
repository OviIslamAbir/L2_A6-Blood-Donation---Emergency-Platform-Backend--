import { Router } from "express";

import { AuditLogController } from "./auditLog.controller";
import { auditLogValidation } from "./auditLog.validation";
import { validateRequest } from "../../middleware/validateRequest";
import { Role } from "../../../generated/prisma/browser";
import { auth } from "../../middleware/checkAuth";



const router = Router();

// ======================================================
// GET ALL AUDIT LOGS
// ======================================================

router.get(
	"/",

	auth(Role.ADMIN),
    
	validateRequest(
		auditLogValidation.getAuditLogsSchema,
	),

	AuditLogController.getAuditLogs,
);

// ======================================================
// GET SINGLE AUDIT LOG
// ======================================================

router.get(
	"/:auditLogId",

	auth(Role.ADMIN),

	AuditLogController.getSingleAuditLog,
);

export const AuditLogRoutes = router;