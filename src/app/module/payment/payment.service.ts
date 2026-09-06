import Stripe from "stripe";
import httpStatus from "http-status";

import type {
	ICreatePaymentPayload,
	IBkashExecutePayload,
} from "./payment.interface";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { getBkashIdToken } from "../../lib/bkash";
import { AppError } from "../../utils/apiError";

import {
	NotificationType,
	PaymentProvider,
	PaymentStatus,
	Role,
	RequestStatus,
} from "../../../generated/prisma/enums";

import { AuditLogServices } from "../auditLog/auditLog.service";

const stripe = new Stripe(config.stripe_secret_key);

const getErrorMessage = (result: any, fallback: string) => {
	return (
		result?.statusMessage ||
		result?.message ||
		result?.errorMessage ||
		result?.error ||
		fallback
	);
};

// ======================================================
// CREATE PAYMENT
// ======================================================

const createPayment = async (
	userId: string,
	payload: ICreatePaymentPayload,
) => {
	const { requestId, amount, provider } = payload;

	if (!Number.isFinite(amount) || amount <= 0) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Payment amount must be greater than 0.",
		);
	}

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found.");
	}

	if (user.deletedAt) {
		throw new AppError(httpStatus.FORBIDDEN, "Your account has been deleted.");
	}

	if (!user.isActive) {
		throw new AppError(httpStatus.FORBIDDEN, "Your account is inactive.");
	}

	if (!user.emailVerified) {
		throw new AppError(httpStatus.FORBIDDEN, "Please verify your email first.");
	}

	if (user.role !== Role.REQUESTER) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only requesters can make payments.",
		);
	}

	const bloodRequest = await prisma.bloodRequest.findUnique({
		where: {
			id: requestId,
		},
	});

	if (!bloodRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Blood request not found.");
	}

	if (bloodRequest.deletedAt) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This blood request has been deleted.",
		);
	}

	if (bloodRequest.requesterId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only pay for your own blood request.",
		);
	}

	if (
		bloodRequest.status === RequestStatus.CANCELLED ||
		bloodRequest.status === RequestStatus.REJECTED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This blood request cannot receive payment.",
		);
	}

	const existingPayment = await prisma.payment.findFirst({
		where: {
			userId,
			requestId,
			status: {
				in: [PaymentStatus.PENDING, PaymentStatus.PAID],
			},
		},
	});

	if (existingPayment) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"A payment already exists for this blood request.",
		);
	}

	const payment = await prisma.payment.create({
		data: {
			userId,
			requestId,
			amount,
			currency: "BDT",
			provider,
			status: PaymentStatus.PENDING,
		},
	});

	await AuditLogServices.createAuditLog({
		userId,
		action: "PAYMENT_CREATED",
		entity: "Payment",
		entityId: payment.id,

		oldValue: null,

		newValue: {
			paymentId: payment.id,
			requestId: payment.requestId,
			amount: amount.toString(),
			currency: "BDT",
			provider,
			status: PaymentStatus.PENDING,
		},
	});

	// ==================================================
	// STRIPE
	// ==================================================

	if (provider === PaymentProvider.STRIPE) {
		try {
			const amountInPaisa = Math.round(amount * 100);

			if (amountInPaisa < 1) {
				throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment amount.");
			}

			const successUrl =
				`${config.bak_url}/api/v1/payments/payment-success` +
				`?paymentId=${encodeURIComponent(payment.id)}`;

			const cancelUrl =
				`${config.bak_url}/api/v1/payments/payment-cancel` +
				`?paymentId=${encodeURIComponent(payment.id)}`;

			const session = await stripe.checkout.sessions.create({
				mode: "payment",

				payment_method_types: ["card"],

				line_items: [
					{
						quantity: 1,

						price_data: {
							currency: "bdt",
							unit_amount: amountInPaisa,

							product_data: {
								name: "Blood Donation Assistance Payment",
								description: `Payment for blood request ${requestId}`,
							},
						},
					},
				],

				metadata: {
					paymentId: payment.id,
					requestId,
					userId,
				},

				payment_intent_data: {
					metadata: {
						paymentId: payment.id,
						requestId,
						userId,
					},
				},

				success_url: successUrl,
				cancel_url: cancelUrl,
			});

			return {
				paymentId: payment.id,
				provider: PaymentProvider.STRIPE,
				checkoutUrl: session.url,
				sessionId: session.id,
			};
		} catch (error: any) {
			try {
				await prisma.payment.delete({
					where: {
						id: payment.id,
					},
				});
			} catch {}

			if (error instanceof AppError) {
				throw error;
			}

			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				error?.message || "Failed to create Stripe checkout session.",
			);
		}
	}

	// ==================================================
	// BKASH
	// ==================================================

	if (provider === PaymentProvider.BKASH) {
		try {
			const payerReference = user.phone || user.email;

			if (!payerReference) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					"Phone number or email is required for bKash payment.",
				);
			}

			const token = await getBkashIdToken();

			if (!token) {
				throw new AppError(
					httpStatus.BAD_GATEWAY,
					"Failed to get bKash ID token.",
				);
			}

			const callbackUrl =
				`${config.bkash_callback_url}` +
				`?paymentId=${encodeURIComponent(payment.id)}`;

			const bkashPayload = {
				mode: "0011",
				payerReference,
				callbackURL: callbackUrl,
				amount: amount.toFixed(2),
				currency: "BDT",
				intent: "sale",
				merchantInvoiceNumber: `BLOOD-${payment.id}`,
			};

			const response = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/create`,
				{
					method: "POST",

					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						Authorization: token,
						"X-App-Key": config.bkash_app_key,
					},

					body: JSON.stringify(bkashPayload),
				},
			);

			const rawResponse = await response.text();

			let result: any;

			try {
				result = JSON.parse(rawResponse);
			} catch {
				result = {
					rawResponse,
				};
			}

			const isCreateSuccess =
				response.ok &&
				result?.statusCode === "0000" &&
				!!result?.paymentID &&
				!!result?.bkashURL;

			if (!isCreateSuccess) {
				const errorMessage = getErrorMessage(
					result,
					"Failed to create bKash payment.",
				);

				await prisma.payment.update({
					where: {
						id: payment.id,
					},

					data: {
						status: PaymentStatus.FAILED,
					},
				});

				await AuditLogServices.createAuditLog({
					userId,

					action: "BKASH_PAYMENT_FAILED",

					entity: "Payment",

					entityId: payment.id,

					oldValue: {
						status: PaymentStatus.PENDING,
					},

					newValue: {
						status: PaymentStatus.FAILED,
						provider: PaymentProvider.BKASH,
						error: errorMessage,
						bkashResponse: result,
					},
				});

				throw new AppError(httpStatus.BAD_GATEWAY, errorMessage);
			}

			await prisma.payment.update({
				where: {
					id: payment.id,
				},

				data: {
					transactionId: result.paymentID,
				},
			});

			await AuditLogServices.createAuditLog({
				userId,

				action: "BKASH_PAYMENT_CREATED",

				entity: "Payment",

				entityId: payment.id,

				oldValue: {
					status: PaymentStatus.PENDING,
					transactionId: null,
				},

				newValue: {
					status: PaymentStatus.PENDING,
					transactionId: result.paymentID,
					provider: PaymentProvider.BKASH,
					amount: amount.toString(),
					currency: "BDT",
					transactionStatus: result.transactionStatus,
				},
			});

			return {
				paymentId: payment.id,

				provider: PaymentProvider.BKASH,

				bkashPaymentId: result.paymentID,

				bkashUrl: result.bkashURL,

				statusCode: result.statusCode,

				statusMessage: result.statusMessage,

				transactionStatus: result.transactionStatus,
			};
		} catch (error: any) {
			if (error instanceof AppError) {
				throw error;
			}

			try {
				await prisma.payment.update({
					where: {
						id: payment.id,
					},

					data: {
						status: PaymentStatus.FAILED,
					},
				});

				await AuditLogServices.createAuditLog({
					userId,

					action: "BKASH_PAYMENT_FAILED",

					entity: "Payment",

					entityId: payment.id,

					oldValue: {
						status: PaymentStatus.PENDING,
					},

					newValue: {
						status: PaymentStatus.FAILED,
						provider: PaymentProvider.BKASH,
						error: error?.message || "Failed to create bKash payment.",
					},
				});
			} catch {}

			throw new AppError(
				httpStatus.BAD_GATEWAY,
				error?.message || "Failed to create bKash payment.",
			);
		}
	}

	await prisma.payment.update({
		where: {
			id: payment.id,
		},

		data: {
			status: PaymentStatus.FAILED,
		},
	});

	await AuditLogServices.createAuditLog({
		userId,

		action: "PAYMENT_FAILED",

		entity: "Payment",

		entityId: payment.id,

		oldValue: {
			status: PaymentStatus.PENDING,
		},

		newValue: {
			status: PaymentStatus.FAILED,
			provider,
		},
	});

	throw new AppError(httpStatus.BAD_REQUEST, "Unsupported payment provider.");
};

// ======================================================
// EXECUTE BKASH PAYMENT
// ======================================================

const executeBkashPayment = async (
	userId: string,
	payload: IBkashExecutePayload,
) => {
	const payment = await prisma.payment.findUnique({
		where: {
			id: payload.paymentId,
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
	}

	if (payment.userId !== userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You cannot access this payment.");
	}

	if (payment.provider !== PaymentProvider.BKASH) {
		throw new AppError(httpStatus.BAD_REQUEST, "This is not a bKash payment.");
	}

	if (payment.status === PaymentStatus.PAID) {
		return payment;
	}

	if (payment.status !== PaymentStatus.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This payment cannot be executed.",
		);
	}

	if (
		!payment.transactionId ||
		payment.transactionId !== payload.bkashPaymentId
	) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid bKash payment ID.");
	}

	const token = await getBkashIdToken();

	if (!token) {
		throw new AppError(httpStatus.BAD_GATEWAY, "Failed to get bKash ID token.");
	}

	const response = await fetch(
		`${config.bkash_base_url}/tokenized/checkout/execute`,
		{
			method: "POST",

			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: token,
				"X-App-Key": config.bkash_app_key,
			},

			body: JSON.stringify({
				paymentID: payment.transactionId,
			}),
		},
	);

	const rawResponse = await response.text();

	let result: any;

	try {
		result = JSON.parse(rawResponse);
	} catch {
		result = {
			rawResponse,
		};
	}

	if (!response.ok) {
		await prisma.payment.update({
			where: {
				id: payment.id,
			},

			data: {
				status: PaymentStatus.FAILED,
			},
		});

		await AuditLogServices.createAuditLog({
			userId,

			action: "BKASH_PAYMENT_FAILED",

			entity: "Payment",

			entityId: payment.id,

			oldValue: {
				status: PaymentStatus.PENDING,
			},

			newValue: {
				status: PaymentStatus.FAILED,
				provider: PaymentProvider.BKASH,
				error: getErrorMessage(result, "bKash payment execution failed."),
				bkashResponse: result,
			},
		});

		throw new AppError(
			httpStatus.BAD_GATEWAY,
			getErrorMessage(result, "bKash payment execution failed."),
		);
	}

	const isCompleted =
		result?.transactionStatus === "Completed" || result?.statusCode === "0000";

	if (!isCompleted) {
		await prisma.payment.update({
			where: {
				id: payment.id,
			},

			data: {
				status: PaymentStatus.FAILED,
			},
		});

		await AuditLogServices.createAuditLog({
			userId,

			action: "BKASH_PAYMENT_FAILED",

			entity: "Payment",

			entityId: payment.id,

			oldValue: {
				status: PaymentStatus.PENDING,
			},

			newValue: {
				status: PaymentStatus.FAILED,
				provider: PaymentProvider.BKASH,
				transactionStatus: result?.transactionStatus,
				statusCode: result?.statusCode,
				error: getErrorMessage(result, "bKash payment was not completed."),
				bkashResponse: result,
			},
		});

		throw new AppError(
			httpStatus.BAD_REQUEST,
			getErrorMessage(result, "bKash payment was not completed."),
		);
	}

	// ==================================================
	// PAYMENT SUCCESS
	// ==================================================

	const updatedPayment = await prisma.$transaction(async (tx) => {
		const currentPayment = await tx.payment.findUnique({
			where: {
				id: payment.id,
			},
		});

		if (!currentPayment) {
			throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
		}

		if (currentPayment.status === PaymentStatus.PAID) {
			return currentPayment;
		}

		const updated = await tx.payment.update({
			where: {
				id: payment.id,
			},

			data: {
				status: PaymentStatus.PAID,

				transactionId: result?.trxID || currentPayment.transactionId,

				paidAt: new Date(),
			},
		});

		await tx.notification.create({
			data: {
				userId: currentPayment.userId,

				title: "Payment Successful",

				message: "Your bKash payment has been completed successfully.",

				type: NotificationType.PAYMENT,
			},
		});

		return updated;
	});

	await AuditLogServices.createAuditLog({
		userId,

		action: "BKASH_PAYMENT_PAID",

		entity: "Payment",

		entityId: payment.id,

		oldValue: {
			status: PaymentStatus.PENDING,
			transactionId: payment.transactionId,
		},

		newValue: {
			status: PaymentStatus.PAID,

			transactionId: result?.trxID || payment.transactionId,

			provider: PaymentProvider.BKASH,

			paidAt: updatedPayment.paidAt,

			transactionStatus: result?.transactionStatus,

			statusCode: result?.statusCode,
		},
	});

	return updatedPayment;
};

// ======================================================
// BKASH CALLBACK
// ======================================================

const bkashCallback = async (
	paymentId: string,
	bkashPaymentId?: string,
	status?: string,
) => {
	const payment = await prisma.payment.findUnique({
		where: {
			id: paymentId,
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
	}

	if (payment.provider !== PaymentProvider.BKASH) {
		throw new AppError(httpStatus.BAD_REQUEST, "This is not a bKash payment.");
	}

	const normalizedStatus = status?.toLowerCase();

	if (
		normalizedStatus === "cancel" ||
		normalizedStatus === "cancelled" ||
		normalizedStatus === "failure" ||
		normalizedStatus === "failed"
	) {
		if (payment.status === PaymentStatus.PENDING) {
			await prisma.payment.update({
				where: {
					id: payment.id,
				},

				data: {
					status: PaymentStatus.CANCELLED,
				},
			});

			await AuditLogServices.createAuditLog({
				userId: payment.userId,

				action: "BKASH_PAYMENT_CANCELLED",

				entity: "Payment",

				entityId: payment.id,

				oldValue: {
					status: PaymentStatus.PENDING,
				},

				newValue: {
					status: PaymentStatus.CANCELLED,

					bkashPaymentId: bkashPaymentId || payment.transactionId,

					callbackStatus: status,
				},
			});
		}

		return {
			paymentId,

			bkashPaymentId: bkashPaymentId || payment.transactionId,

			status: PaymentStatus.CANCELLED,
		};
	}

	return {
		paymentId,

		bkashPaymentId: bkashPaymentId || payment.transactionId,

		status: status || "success",
	};
};

const stripeWebhook = async (body: Buffer, signature: string) => {
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			config.stripe_webhook_secret,
		);
	} catch (error: any) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			`Stripe Webhook Error: ${error?.message || "Invalid signature."}`,
		);
	}

	switch (event.type) {
		case "checkout.session.completed": {
			const session = event.data.object as Stripe.Checkout.Session;

			const paymentId = session.metadata?.paymentId;

			if (!paymentId) {
				break;
			}

			if (session.payment_status !== "paid") {
				break;
			}

			let paidPaymentUserId: string | null = null;

			let oldStatus: PaymentStatus | null = null;

			let newTransactionId: string | null = null;

			await prisma.$transaction(async (tx) => {
				const payment = await tx.payment.findUnique({
					where: {
						id: paymentId,
					},
				});

				if (!payment) {
					return;
				}

				if (payment.status === PaymentStatus.PAID) {
					return;
				}

				paidPaymentUserId = payment.userId;

				oldStatus = payment.status;

				newTransactionId =
					typeof session.payment_intent === "string"
						? session.payment_intent
						: payment.transactionId;

				await tx.payment.update({
					where: {
						id: paymentId,
					},

					data: {
						status: PaymentStatus.PAID,

						transactionId: newTransactionId,

						paidAt: new Date(),
					},
				});

				await tx.notification.create({
					data: {
						userId: payment.userId,

						title: "Payment Successful",

						message: "Your Stripe payment has been completed successfully.",

						type: NotificationType.PAYMENT,
					},
				});
			});

			if (paidPaymentUserId) {
				await AuditLogServices.createAuditLog({
					userId: paidPaymentUserId,

					action: "STRIPE_PAYMENT_PAID",

					entity: "Payment",

					entityId: paymentId,

					oldValue: {
						status: oldStatus,
					},

					newValue: {
						status: PaymentStatus.PAID,

						transactionId: newTransactionId,

						provider: PaymentProvider.STRIPE,

						paidAt: new Date(),
					},
				});
			}

			break;
		}

		case "payment_intent.payment_failed": {
			const paymentIntent = event.data.object as Stripe.PaymentIntent;

			const paymentId = paymentIntent.metadata?.paymentId;

			if (!paymentId) {
				break;
			}

			let failedUserId: string | null = null;

			let previousStatus: PaymentStatus | null = null;

			await prisma.$transaction(async (tx) => {
				const payment = await tx.payment.findUnique({
					where: {
						id: paymentId,
					},
				});

				if (!payment) {
					return;
				}

				if (payment.status === PaymentStatus.PAID) {
					return;
				}

				failedUserId = payment.userId;

				previousStatus = payment.status;

				await tx.payment.update({
					where: {
						id: paymentId,
					},

					data: {
						status: PaymentStatus.FAILED,
					},
				});

				await tx.notification.create({
					data: {
						userId: payment.userId,

						title: "Payment Failed",

						message: "Your Stripe payment could not be completed.",

						type: NotificationType.PAYMENT,
					},
				});
			});

			if (failedUserId) {
				await AuditLogServices.createAuditLog({
					userId: failedUserId,

					action: "STRIPE_PAYMENT_FAILED",

					entity: "Payment",

					entityId: paymentId,

					oldValue: {
						status: previousStatus,
					},

					newValue: {
						status: PaymentStatus.FAILED,

						provider: PaymentProvider.STRIPE,

						paymentIntentId: paymentIntent.id,

						error:
							paymentIntent.last_payment_error?.message ||
							"Stripe payment failed.",
					},
				});
			}

			break;
		}

		case "checkout.session.expired": {
			const session = event.data.object as Stripe.Checkout.Session;

			const paymentId = session.metadata?.paymentId;

			if (!paymentId) {
				break;
			}

			const payment = await prisma.payment.findUnique({
				where: {
					id: paymentId,
				},
			});

			if (!payment) {
				break;
			}

			if (payment.status === PaymentStatus.PAID) {
				break;
			}

			await prisma.payment.update({
				where: {
					id: paymentId,
				},

				data: {
					status: PaymentStatus.FAILED,
				},
			});

			await AuditLogServices.createAuditLog({
				userId: payment.userId,

				action: "STRIPE_PAYMENT_EXPIRED",

				entity: "Payment",

				entityId: payment.id,

				oldValue: {
					status: payment.status,
				},

				newValue: {
					status: PaymentStatus.FAILED,

					provider: PaymentProvider.STRIPE,

					sessionId: session.id,
				},
			});

			break;
		}

		default:
			break;
	}

	return {
		received: true,
	};
};

// ======================================================
// GET MY PAYMENTS
// ======================================================

const getMyPayments = async (userId: string) => {
	return await prisma.payment.findMany({
		where: {
			userId,
		},

		orderBy: {
			createdAt: "desc",
		},

		include: {
			request: {
				select: {
					id: true,
					patientName: true,
					bloodGroup: true,
					units: true,
					hospitalName: true,
					hospitalAddress: true,
					urgency: true,
					status: true,
					neededAt: true,
				},
			},
		},
	});
};

// ======================================================
// GET SINGLE PAYMENT
// ======================================================

const getSinglePayment = async (paymentId: string, userId: string) => {
	const payment = await prisma.payment.findUnique({
		where: {
			id: paymentId,
		},

		include: {
			request: {
				include: {
					requester: {
						select: {
							id: true,
							name: true,
							email: true,
							phone: true,
							role: true,
						},
					},
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found.");
	}

	if (payment.userId !== userId) {
		throw new AppError(httpStatus.FORBIDDEN, "You cannot access this payment.");
	}

	return payment;
};

export const PaymentServices = {
	createPayment,
	executeBkashPayment,
	bkashCallback,
	stripeWebhook,
	getMyPayments,
	getSinglePayment,
};
