import type z from "zod";
import {
	type NextFunction,
	type Request,
	type Response,
	Router,
} from "express";
import { catchAsync } from "../utils/catchAsync";
export const validateRequest = (zodSchema: z.ZodObject) => {
	return catchAsync((req: Request, res: Response, next: NextFunction) => {
		const payload = req.body ?? {};
		const result = zodSchema.safeParse(payload);
		if (result.success === false) {
			let errorMassage = "";
			result.error.issues.forEach((issue) => {
				errorMassage = errorMassage + ", " + issue.message;
			});
			throw new Error(errorMassage);
		}
		req.body = result.data;
		next();
	});
};
