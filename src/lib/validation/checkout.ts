import { z } from "zod";

export const checkoutSchema = z.object({
  productId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});
