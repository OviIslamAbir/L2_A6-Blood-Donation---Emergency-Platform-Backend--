import z from "zod";

const requestIdParamSchema = z.object({
  requestId: z
    .string()
    .trim()
    .min(1, "Request ID is required."),
});

const matchIdParamSchema = z.object({
  matchId: z
    .string()
    .trim()
    .min(1, "Match ID is required."),
});

export const donorMatchValidation = {
  requestIdParamSchema,
  matchIdParamSchema,
};