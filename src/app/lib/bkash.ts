import httpStatus from "http-status";

import config from "../config";
import { redisClient } from "./redis";
import { AppError } from "../utils/apiError";

const ID_TOKEN_KEY = "bkash:idToken";
const REFRESH_TOKEN_KEY = "bkash:refreshToken";

const TOKEN_EXPIRY_SECONDS = 60 * 60;
const REFRESH_TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 28;
const TOKEN_REFRESH_BUFFER_SECONDS = 600;

export const getBkashIdToken = async (): Promise<string> => {
	try {
		let idToken = await redisClient.get(ID_TOKEN_KEY);

		const idTokenTTL = await redisClient.ttl(ID_TOKEN_KEY);

		const refreshToken =
			await redisClient.get(REFRESH_TOKEN_KEY);

		const refreshTokenTTL =
			await redisClient.ttl(REFRESH_TOKEN_KEY);

		// ================================================
		// REFRESH EXISTING TOKEN
		// ================================================

		if (
			(!idToken ||
				idTokenTTL <= TOKEN_REFRESH_BUFFER_SECONDS) &&
			refreshToken &&
			refreshTokenTTL > TOKEN_REFRESH_BUFFER_SECONDS
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

			const result = await response.json();

			if (!response.ok) {
				throw new AppError(
					httpStatus.BAD_GATEWAY,
					result.statusMessage ||
						"bKash access token refresh failed.",
				);
			}

			if (!result.id_token) {
				throw new AppError(
					httpStatus.BAD_GATEWAY,
					"bKash refresh response missing id_token.",
				);
			}

			idToken = result.id_token;

			await redisClient.set(
				ID_TOKEN_KEY,
				idToken as string,
				{
					expiration: {
						type: "EX",
						value: TOKEN_EXPIRY_SECONDS,
					},
				},
			);

			return idToken as string;
		}

		// ================================================
		// USE CACHED TOKEN
		// ================================================

		if (
			idToken &&
			idTokenTTL > TOKEN_REFRESH_BUFFER_SECONDS
		) {
			return idToken;
		}

		// ================================================
		// GRANT NEW TOKEN
		// ================================================

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

		const result = await response.json();

		if (!response.ok) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				result.statusMessage ||
					"bKash access token grant failed.",
			);
		}

		if (!result.id_token) {
			throw new AppError(
				httpStatus.BAD_GATEWAY,
				"bKash token response missing id_token.",
			);
		}

		await redisClient.set(
			ID_TOKEN_KEY,
			result.id_token,
			{
				expiration: {
					type: "EX",
					value: TOKEN_EXPIRY_SECONDS,
				},
			},
		);

		if (result.refresh_token) {
			await redisClient.set(
				REFRESH_TOKEN_KEY,
				result.refresh_token,
				{
					expiration: {
						type: "EX",
						value: REFRESH_TOKEN_EXPIRY_SECONDS,
					},
				},
			);
		}

		return result.id_token;
	} catch (error: any) {
		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError(
			httpStatus.BAD_GATEWAY,
			error?.message ||
				"bKash service unavailable.",
		);
	}
};