import { z } from "zod";

export const accountSchema = z.object({
    code: z.string().min(1, "Account Code is required"),
    name: z.string().min(1, "Account Name is required"),
    type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
