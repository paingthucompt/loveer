import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = registerSchema;

export const clientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  bank_account: z
    .array(
      z.object({
        bank_name: z.string().min(1),
        account_number: z.string().min(1)
      })
    )
    .optional()
    .nullable(),
  commission_percentage: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
  preferred_payout_currency: z.enum(["THB", "MMK"])
});

export const transactionSchema = z.object({
  client_id: z.string().min(1),
  incoming_amount_thb: z.preprocess((val) => Number(val), z.number().min(0)),
  fees: z.preprocess((val) => Number(val ?? 0), z.number().min(0)),
  exchange_rate_mmk: z.preprocess((val) => Number(val), z.number().min(0)),
  transaction_date: z.string().min(1),
  notes: z.string().optional().nullable()
});

export const invoiceSchema = z.object({
  transaction_id: z.string().min(1)
});
