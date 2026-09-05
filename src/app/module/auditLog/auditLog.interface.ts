export interface ICreateAuditLogPayload {
	userId?: string;
	action: string;
	entity: string;
	entityId?: string;
	oldValue?: unknown;
	newValue?: unknown;
	ipAddress?: string;
}

export interface IGetAuditLogsQuery {
	page?: number;
	limit?: number;
	entity?: string;
	action?: string;
	userId?: string;
}