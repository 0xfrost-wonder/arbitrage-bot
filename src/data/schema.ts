import { z } from "zod"

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const logSchema = z.object({
  id: z.string(),
  wallet: z.string(),
  token0: z.string(),
  token1: z.string(),
  amountIn: z.number(),
  amountOut: z.number(),
  type: z.string(),
  block: z.string(),
})

export type Log = z.infer<typeof logSchema>
