import { Router } from "express";
import { prisma } from "../prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { transactionSchema } from "../validators";
import { serializeTransaction } from "../utils/serializers";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const availableOnly = req.query.available === "true";

  const transactions = await prisma.transaction.findMany({
    where: {
      client: { userId: req.userId },
      ...(availableOnly ? { invoices: { none: {} } } : {})
    },
    include: {
      client: true
    },
    orderBy: { transactionDate: "desc" }
  });

  return res.json(transactions.map(serializeTransaction));
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const parseResult = transactionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parseResult.error.flatten() });
  }

  const data = parseResult.data;
  const client = await prisma.client.findFirst({
    where: { id: data.client_id, userId: req.userId }
  });

  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }

  const commissionPercentage = Number(client.commissionPercentage);
  const commissionAmountThb = (data.incoming_amount_thb * commissionPercentage) / 100;
  const netPayableThb = data.incoming_amount_thb - commissionAmountThb - data.fees;
  const payoutCurrency = client.preferredPayoutCurrency;
  const payoutAmount =
    payoutCurrency === "MMK" ? netPayableThb * data.exchange_rate_mmk : netPayableThb;

  const transaction = await prisma.transaction.create({
    data: {
      clientId: client.id,
      incomingAmountThb: data.incoming_amount_thb,
      fees: data.fees,
      exchangeRateMmk: data.exchange_rate_mmk,
      payoutCurrency,
      payoutAmount,
      transactionDate: new Date(data.transaction_date),
      notes: data.notes ?? null
    },
    include: {
      client: true
    }
  });

  return res.status(201).json(serializeTransaction(transaction));
});

export const transactionsRouter = router;
