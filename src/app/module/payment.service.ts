import Stripe from "stripe";
import httpStatus from "http-status";


import type {
	ICreatePaymentPayload,
	IBkashExecutePayload,
} from "./payment.interface";
import config from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/apiError";
import { NotificationType, PaymentProvider, PaymentStatus, RequestStatus, Role } from "../../generated/prisma/browser";
import { getBkashIdToken } from "../lib/bkash";

const stripe = new Stripe(config.stripe_secret_key);

// ======================================================
// CREATE PAYMENT
// ======================================================

const createPayment = async (
	userId: string,
	payload: ICreatePaymentPayload,
) => {
	const { requestId, amount, provider } = payload;

	// ==================================================
	// CHECK USER
	// ==================================================

	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	if (!user) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"User not found.",
		);
	}

	if (user.deletedAt) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account has been deleted.",
		);
	}

	if (!user.isActive) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your account is inactive.",
		);
	}

	if (!user.emailVerified) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Please verify your email first.",
		);
	}

	if (user.role !== Role.REQUESTER) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only requesters can make payments.",
		);
	}

	// ==================================================
	// CHECK BLOOD REQUEST
	// ==================================================

	const bloodRequest =
		await prisma.bloodRequest.findUnique({
			where: {
				id: requestId,
			},
		});

	if (!bloodRequest) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Blood request not found.",
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

	if (bloodRequest.status === RequestStatus.COMPLETED) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This blood request has already been completed.",
		);
	}

	// ==================================================
	// CHECK EXISTING PAYMENT
	// ==================================================

	const existingPayment =
		await prisma.payment.findFirst({
			where: {
				userId,
				requestId,
				status: {
					in: [
						PaymentStatus.PENDING,
						PaymentStatus.PAID,
					],
				},
			},
		});

	if (existingPayment) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"A payment already exists for this blood request.",
		);
	}

	// ==================================================
	// CREATE DATABASE PAYMENT
	// ==================================================

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

	// ==================================================
	// STRIPE
	// ==================================================

	if (provider === PaymentProvider.STRIPE) {
		try {
			const session =
				await stripe.checkout.sessions.create({
					mode: "payment",

					payment_method_types: ["card"],

					line_items: [
						{
							quantity: 1,

							price_data: {
								currency: "bdt",

								unit_amount:
									Math.round(amount * 100),

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

					success_url:
						`${config.bak_url}/api/v1/payments/payment-success?paymentId=${payment.id}`,

					cancel_url:
						`${config.bak_url}/api/v1/payments/payment-cancel`,
				});

			return {
				paymentId: payment.id,
				provider: PaymentProvider.STRIPE,
				checkoutUrl: session.url,
				sessionId: session.id,
			};
		} catch (error: any) {
			await prisma.payment.delete({
				where: {
					id: payment.id,
				},
			});

			throw new AppError(
				httpStatus.INTERNAL_SERVER_ERROR,
				`Failed to create Stripe checkout session: ${error.message}`,
			);
		}
	}

	// ==================================================
	// BKASH
	// ==================================================

	if (provider === PaymentProvider.BKASH) {
		try {
			const token = await getBkashIdToken();

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

					body: JSON.stringify({
						mode: "001",

						payerReference:
							user.phone || user.email,

						callbackURL:
							config.bkash_callback_url,

						amount: amount.toFixed(2),

						currency: "BDT",

						intent: "sale",

						merchantInvoiceNumber:
							`BLOOD-${payment.id}`,
					}),
				},
			);

			const result = await response.json();

			if (!response.ok || !result.paymentID) {
				await prisma.payment.update({
					where: {
						id: payment.id,
					},

					data: {
						status: PaymentStatus.FAILED,
					},
				});

				throw new AppError(
					httpStatus.BAD_GATEWAY,
					result.statusMessage ||
						"Failed to create bKash payment.",
				);
			}

			// Store bKash payment ID
			await prisma.payment.update({
				where: {
					id: payment.id,
				},

				data: {
					transactionId: result.paymentID,
				},
			});

			return {
				paymentId: payment.id,

				provider: PaymentProvider.BKASH,

				bkashPaymentId: result.paymentID,

				bkashUrl: result.bkashURL,
			};
		} catch (error: any) {
			if (error instanceof AppError) {
				throw error;
			}

			throw new AppError(
				httpStatus.BAD_GATEWAY,
				error.message ||
					"Failed to create bKash payment.",
			);
		}
	}

	throw new AppError(
		httpStatus.BAD_REQUEST,
		"Unsupported payment provider.",
	);
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

		include: {
			request: true,
		},
	});

	if (!payment) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Payment not found.",
		);
	}

	if (payment.userId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You cannot access this payment.",
		);
	}

	if (payment.provider !== PaymentProvider.BKASH) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This is not a bKash payment.",
		);
	}

	if (payment.status === PaymentStatus.PAID) {
		return payment;
	}

	const token = await getBkashIdToken();

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
				paymentID:
					payload.bkashPaymentId,
			}),
		},
	);

	const result = await response.json();

	if (!response.ok) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			result.statusMessage ||
				"bKash payment execution failed.",
		);
	}

	if (
		result.transactionStatus !== "Completed" &&
		result.statusCode !== "0000"
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			result.statusMessage ||
				"bKash payment was not completed.",
		);
	}

	// ==================================================
	// PAYMENT SUCCESS
	// ==================================================

	const updatedPayment =
		await prisma.$transaction(async (tx: any) => {
			const updated =
				await tx.payment.update({
					where: {
						id: payment.id,
					},

					data: {
						status: PaymentStatus.PAID,

						transactionId:
							result.trxID ||
							payload.bkashPaymentId,

						paidAt: new Date(),
					},
				});

			await tx.notification.create({
				data: {
					userId: payment.userId,

					title: "Payment Successful",

					message:
						"Your bKash payment has been completed successfully.",

					type: NotificationType.PAYMENT,
				},
			});

			return updated;
		});

	return updatedPayment;
};

// ======================================================
// STRIPE WEBHOOK
// ======================================================

const stripeWebhook = async (
	body: Buffer,
	signature: string,
) => {
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
			`Stripe Webhook Error: ${error.message}`,
		);
	}

	switch (event.type) {
		// ================================================
		// PAYMENT SUCCESS
		// ================================================

		case "checkout.session.completed": {
			const session =
				event.data.object as Stripe.Checkout.Session;

			const paymentId =
				session.metadata?.paymentId;

			if (!paymentId) {
				throw new AppError(
					httpStatus.BAD_REQUEST,
					"Payment ID not found in Stripe metadata.",
				);
			}

			const payment =
				await prisma.payment.findUnique({
					where: {
						id: paymentId,
					},
				});

			if (!payment) {
				throw new AppError(
					httpStatus.NOT_FOUND,
					"Payment not found.",
				);
			}

			// Prevent duplicate webhook
			if (payment.status === PaymentStatus.PAID) {
				return {
					received: true,
				};
			}

			await prisma.$transaction(
				async (tx: any) => {
					await tx.payment.update({
						where: {
							id: paymentId,
						},

						data: {
							status: PaymentStatus.PAID,

							transactionId:
								typeof session.payment_intent ===
								"string"
									? session.payment_intent
									: null,

							paidAt: new Date(),
						},
					});

					await tx.notification.create({
						data: {
							userId: payment.userId,

							title: "Payment Successful",

							message:
								"Your Stripe payment has been completed successfully.",

							type: NotificationType.PAYMENT,
						},
					});
				},
			);

			break;
		}

		// ================================================
		// PAYMENT FAILED
		// ================================================

		case "payment_intent.payment_failed": {
			const paymentIntent =
				event.data.object as Stripe.PaymentIntent;

			const paymentId =
				paymentIntent.metadata?.paymentId;

			if (!paymentId) {
				break;
			}

			const payment =
				await prisma.payment.findUnique({
					where: {
						id: paymentId,
					},
				});

			if (!payment) {
				break;
			}

			await prisma.$transaction(
				async (tx: any) => {
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

							message:
								"Your Stripe payment could not be completed.",

							type: NotificationType.PAYMENT,
						},
					});
				},
			);

			break;
		}

		// ================================================
		// CHECKOUT EXPIRED
		// ================================================

		case "checkout.session.expired": {
			const session =
				event.data.object as Stripe.Checkout.Session;

			const paymentId =
				session.metadata?.paymentId;

			if (!paymentId) {
				break;
			}

			const payment =
				await prisma.payment.findUnique({
					where: {
						id: paymentId,
					},
				});

			if (!payment) {
				break;
			}

			if (
				payment.status !==
				PaymentStatus.PAID
			) {
				await prisma.payment.update({
					where: {
						id: paymentId,
					},

					data: {
						status: PaymentStatus.FAILED,
					},
				});
			}

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

const getMyPayments = async (
	userId: string,
) => {
	const payments =
		await prisma.payment.findMany({
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

	return payments;
};

// ======================================================
// GET SINGLE PAYMENT
// ======================================================

const getSinglePayment = async (
	paymentId: string,
	userId: string,
) => {
	const payment =
		await prisma.payment.findUnique({
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
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Payment not found.",
		);
	}

	if (payment.userId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You cannot access this payment.",
		);
	}

	return payment;
};

export const PaymentServices = {
	createPayment,
	executeBkashPayment,
	stripeWebhook,
	getMyPayments,
	getSinglePayment,
};