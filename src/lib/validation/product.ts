import { z } from "zod";

export const productSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(20).max(4000),
  year: z.coerce.number().int().min(1000).max(new Date().getFullYear()).optional(),
  estimated_age: z.string().trim().max(80).optional(),
  price: z.coerce.number().positive().max(999_999_999),
  category: z.string().trim().max(80).optional(),
  condition: z.string().trim().max(80).optional(),
  dimensions: z.string().trim().max(160).optional(),
  material: z.string().trim().max(160).optional(),
  location: z.string().trim().max(160).optional(),
  origin_story: z.string().trim().max(2000).optional(),
});

export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
export const maxImageBytes = 5 * 1024 * 1024;
