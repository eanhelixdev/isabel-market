import { z } from "zod";

export const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  gender: z.string().trim().max(40).optional().nullable(),
  age: z.coerce.number().int().min(13).max(120).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});
