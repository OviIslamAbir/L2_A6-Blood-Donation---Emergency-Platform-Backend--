import httpStatus from "http-status";
import config from "../config";
import { redisClient } from "./redis";
import { AppError } from "../utils/apiError";

const ID_TOKEN_KEY = "bkash:idToken";
const REFRESH_TOKEN_KEY = "bkash:refreshToken";

export const getBkashIdToken = async () => {
	try {
		let idToken = await redisClient.get(ID_TOKEN_KEY);

		const idTokenTTL = await redisClient.ttl(ID_TOKEN_KEY);

		const refreshToken =
			await redisClient.get(REFRESH_TOKEN_KEY);

		const refreshTokenTTL =
			await redisClient.ttl(REFRESH_TOKEN_KEY);

		// ==========================================
		// REFRESH EXISTING TOKEN
		// ==========================================

		if (
			(idTokenTTL <= 600 || !idToken) &&
			refreshToken &&
			refreshTokenTTL > 600
		) {
			const response = await fetch(
				`${config.bkash_base_url}/tokenized/checkout/token/refresh`,
				{
					method: "POST",

					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
						username: config.bkash_username,
						password: config.bkash_password,
					},

					body: JSON.stringify({
						app_key: config.bkash_app_key,
						app_secret: config.bkash_app_secret,
						refresh_token: refreshToken,
					}),
				},
			);

			if (!response.ok) {
				throw new AppError(
					httpStatus.BAD_GATEWAY,
					"bKash access token refresh failed.",
				);
			}

			const result = await response.json();
			const refreshedIdToken = result.id_token;

			if (!refreshedIdToken) {
				throw new AppError(
					httpStatus.BAD_GATEWAY,
					"bKash access token refresh response missing id_token.",
				);
			}

			idToken = refreshedIdToken;

			await redisClient.set(
				ID_TOKEN_KEY,
				refreshedIdToken,
				{
					expiration: {
						type: "EX",
						value: 60 * 60,
					},
				},
			);

			return refreshedIdToken;
		}

		// ==========================================
		// EXISTING TOKEN STILL VALID
		// ==========================================

		if (idToken && idTokenTTL > 600) {
			return idToken;
		}

		// ==========================================
		// GRANT NEW TOKEN
		// ==========================================

		const response = await fetch(
			`${config.bkash_base_url}/tokenized/checkout/token/grant`,
			{
				method: "POST",

				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					username: config.bkash_username,
					password: config.bkash_password,
				},

				body: JSON.stringify({
					app_key: config.bkash_app_key,
					app_secret: config.bkash_app_secret,
				}),
			},
		);

		if (!response.ok) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				"bKash access token grant failed.",
			);
		}

		const result = await response.json();

		await redisClient.set(
			ID_TOKEN_KEY,
			result.id_token,
			{
				expiration: {
					type: "EX",
					value: 60 * 60,
				},
			},
		);

		await redisClient.set(
			REFRESH_TOKEN_KEY,
			result.refresh_token,
			{
				expiration: {
					type: "EX",
					value: 60 * 60 * 24 * 28,
				},
			},
		);

		return result.id_token;
	} catch (error: any) {
		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError(
			httpStatus.BAD_GATEWAY,
			error.message || "bKash service unavailable.",
		);
	}
};