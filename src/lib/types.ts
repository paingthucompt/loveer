export interface BankAccount {
  bank_name: string;
  account_number: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  bank_account: BankAccount[] | null;
  commission_percentage: number;
  preferred_payout_currency: "THB" | "MMK";
}

export interface TransactionClientInfo {
  id: string;
  name: string;
  commission_percentage: number;
  preferred_payout_currency: "THB" | "MMK";
}

export interface Transaction {
  id: string;
  client_id: string;
  incoming_amount_thb: number;
  fees: number;
  exchange_rate_mmk: number;
  payout_currency: "THB" | "MMK";
  payout_amount: number | null;
  transaction_date: string;
  notes: string | null;
  clients: TransactionClientInfo;
}

export interface InvoiceTransactionDetails {
  incoming_amount_thb: number;
  fees: number;
  transaction_date: string;
  exchange_rate_mmk: number;
  payout_currency: "THB" | "MMK";
  payout_amount: number;
}

export interface InvoiceClientDetails {
  id: string;
  name: string;
  phone: string | null;
  bank_account: BankAccount[] | null;
  commission_percentage: number;
  preferred_payout_currency: "THB" | "MMK";
}

export interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
  clients: InvoiceClientDetails;
  transactions: InvoiceTransactionDetails;
}
