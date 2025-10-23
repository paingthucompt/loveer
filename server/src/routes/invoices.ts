import { Router } from "express";
import { prisma } from "../prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { invoiceSchema } from "../validators";
import { serializeInvoice } from "../utils/serializers";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      client: { userId: req.userId }
    },
    include: {
      client: true,
      transaction: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json(invoices.map(serializeInvoice));
});

const generateInvoiceNumber = async () => {
  const latest = await prisma.invoice.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true }
  });

  if (!latest?.invoiceNumber) {
    return "INV-000001";
  }

  const match = latest.invoiceNumber.match(/INV-(\d+)/);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `INV-${next.toString().padStart(6, "0")}`;
};

router.post("/", async (req: AuthenticatedRequest, res) => {
  const parseResult = invoiceSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parseResult.error.flatten() });
  }

  const { transaction_id } = parseResult.data;

  const transaction = await prisma.transaction.findFirst({
    where: { id: transaction_id, client: { userId: req.userId } },
    include: {
      client: true,
      invoices: true
    }
  });

  if (!transaction) {
    return res.status(404).json({ message: "Transaction not found" });
  }

  if (transaction.invoices.length > 0) {
    return res.status(400).json({ message: "Invoice already generated for this transaction" });
  }

  const commissionPercentage = Number(transaction.client.commissionPercentage);
  const totalAmount = Number(transaction.incomingAmountThb);
  const commissionAmount = (totalAmount * commissionPercentage) / 100;
  const netAmount = totalAmount - commissionAmount - Number(transaction.fees);

  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      clientId: transaction.clientId,
      transactionId: transaction.id,
      invoiceNumber,
      totalAmount,
      commissionAmount,
      netAmount
    },
    include: {
      client: true,
      transaction: true
    }
  });

  return res.status(201).json(serializeInvoice(invoice));
});

export const invoicesRouter = router;
