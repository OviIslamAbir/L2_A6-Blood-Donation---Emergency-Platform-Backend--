import { z } from "zod";

const getAuditLogsSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1),

		limit: z.coerce.number().int().min(1).max(100).default(20),

		entity: z.string().trim().min(1).optional(),

		action: z.string().trim().min(1).optional(),

		userId: z.string().uuid().optional(),
	}),
});

export const auditLogValidation = {
	getAuditLogsSchema,
};
