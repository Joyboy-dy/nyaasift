import { z } from "zod";

/** Response of GET /api/health, shared by the API and the web app. */
export const healthSchema = z.object({ ok: z.literal(true) });

export type Health = z.infer<typeof healthSchema>;
