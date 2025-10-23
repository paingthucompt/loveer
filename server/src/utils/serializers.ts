import { Prisma } from "@prisma/client";

const decimalToNumber = (value: Prisma.Decimal | null | undefined) =>
  value !== null && value !== undefined ? Number(value) : null;

export const serializeClient = (client: any) => ({
  id: client.id,
  name: client.name,
  phone: client.phone,
  bank_account: client.bankAccounts,
  commission_percentage: decimalToNumber(client.commissionPercentage) ?? 0,
  preferred_payout_currency: client.preferredPayoutCurrency,
  created_at: client.createdAt,
  updated_at: client.updatedAt
});

export const serializeTransaction = (transaction: any) => ({
  id: transaction.id,
  client_id: transaction.clientId,
  incoming_amount_thb: decimalToNumber(transaction.incomingAmountThb) ?? 0,
  fees: decimalToNumber(transaction.fees) ?? 0,
  exchange_rate_mmk: decimalToNumber(transaction.exchangeRateMmk) ?? 0,
  payout_currency: transaction.payoutCurrency,
  payout_amount: decimalToNumber(transaction.payoutAmount),
  transaction_date: transaction.transactionDate,
  notes: transaction.notes,
  created_at: transaction.createdAt,
  updated_at: transaction.updatedAt,
  clients: transaction.client
    ? {
        id: transaction.client.id,
        name: transaction.client.name,
        commission_percentage: decimalToNumber(transaction.client.commissionPercentage) ?? 0,
        preferred_payout_currency: transaction.client.preferredPayoutCurrency
      }
    : undefined
});

export const serializeInvoice = (invoice: any) => ({
  id: invoice.id,
  invoice_number: invoice.invoiceNumber,
  total_amount: decimalToNumber(invoice.totalAmount) ?? 0,
  commission_amount: decimalToNumber(invoice.commissionAmount) ?? 0,
  net_amount: decimalToNumber(invoice.netAmount) ?? 0,
  created_at: invoice.createdAt,
  clients: invoice.client
    ? {
        id: invoice.client.id,
        name: invoice.client.name,
        phone: invoice.client.phone,
        bank_account: invoice.client.bankAccounts,
        commission_percentage: decimalToNumber(invoice.client.commissionPercentage) ?? 0,
        preferred_payout_currency: invoice.client.preferredPayoutCurrency
      }
    : undefined,
  transactions: invoice.transaction
    ? {
        incoming_amount_thb: decimalToNumber(invoice.transaction.incomingAmountThb) ?? 0,
        fees: decimalToNumber(invoice.transaction.fees) ?? 0,
        transaction_date: invoice.transaction.transactionDate,
        exchange_rate_mmk: decimalToNumber(invoice.transaction.exchangeRateMmk) ?? 0,
        payout_currency: invoice.transaction.payoutCurrency,
        payout_amount: decimalToNumber(invoice.transaction.payoutAmount) ?? 0
      }
    : undefined
});
