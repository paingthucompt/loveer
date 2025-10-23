import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./env";
import { prisma } from "./prisma";
import { authRouter } from "./routes/auth";
import { clientsRouter } from "./routes/clients";
import { transactionsRouter } from "./routes/transactions";
import { invoicesRouter } from "./routes/invoices";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN ? [env.FRONTEND_ORIGIN] : "*"
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok" });
  } catch (_error) {
    return res.status(500).json({ status: "error" });
  }
});

app.use("/auth", authRouter);
app.use("/clients", clientsRouter);
app.use("/transactions", transactionsRouter);
app.use("/invoices", invoicesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

const port = Number(env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
