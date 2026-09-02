import z from "zod";

const updateDonorProfileSchema = z.object({
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional(),

  dateOfBirth: z
    .string()
    .datetime()
    .or(z.string().date())
    .optional(),

  division: z
    .string()
    .min(2, "Division is required.")
    .optional(),

  district: z
    .string()
    .min(2, "District is required.")
    .optional(),

  address: z
    .string()
    .min(3, "Address is required.")
    .optional(),

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional(),
});

export const donorValidation = {
  updateDonorProfileSchema,
};