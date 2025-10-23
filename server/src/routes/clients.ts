import { Router } from "express";
import { prisma } from "../prisma";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { clientSchema } from "../validators";
import { serializeClient } from "../utils/serializers";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const clients = await prisma.client.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" }
  });

  return res.json(clients.map(serializeClient));
});

router.post("/", async (req: AuthenticatedRequest, res) => {
  const parseResult = clientSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parseResult.error.flatten() });
  }

  const data = parseResult.data;
  const client = await prisma.client.create({
    data: {
      userId: req.userId!,
      name: data.name,
      phone: data.phone ?? null,
      bankAccounts: data.bank_account ?? [],
      commissionPercentage: data.commission_percentage,
      preferredPayoutCurrency: data.preferred_payout_currency
    }
  });

  return res.status(201).json(serializeClient(client));
});

router.put("/:id", async (req: AuthenticatedRequest, res) => {
  const parseResult = clientSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parseResult.error.flatten() });
  }

  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.userId }
  });

  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }

  const data = parseResult.data;
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      name: data.name,
      phone: data.phone ?? null,
      bankAccounts: data.bank_account ?? [],
      commissionPercentage: data.commission_percentage,
      preferredPayoutCurrency: data.preferred_payout_currency
    }
  });

  return res.json(serializeClient(updated));
});

router.delete("/:id", async (req: AuthenticatedRequest, res) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, userId: req.userId }
  });

  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }

  await prisma.client.delete({ where: { id: client.id } });
  return res.status(204).end();
});

export const clientsRouter = router;
