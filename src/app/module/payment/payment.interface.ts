import type { PaymentProvider } from "../../../generated/prisma/enums";

export interface ICreatePaymentPayload {
	requestId: string;
	amount: number;
	provider: PaymentProvider;
}

export interface IBkashExecutePayload {
	paymentId: string;
	bkashPaymentId: string;
}
