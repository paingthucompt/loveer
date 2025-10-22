import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface BankAccount {
  bank_name: string;
  account_number: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
  clients: {
    name: string;
    phone: string | null;
    bank_account: BankAccount[] | null;
    commission_percentage: number;
    preferred_payout_currency: string;
  };
  transactions: {
    incoming_amount_thb: number;
    fees: number;
    transaction_date: string;
    exchange_rate_mmk: number;
    payout_currency: string;
    payout_amount: number;
  };
}

interface Transaction {
  id: string;
  incoming_amount_thb: number;
  fees: number;
  transaction_date: string;
  exchange_rate_mmk: number;
  payout_currency: string;
  payout_amount: number;
  clients: {
    id: string;
    name: string;
    commission_percentage: number;
    preferred_payout_currency: string;
  };
}

const InvoicesTab = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesResult, allTransactionsResult] = await Promise.all([
        supabase
          .from("invoices")
          .select(`
            *,
            clients (name, phone, bank_account, commission_percentage, preferred_payout_currency),
            transactions (incoming_amount_thb, fees, transaction_date, exchange_rate_mmk, payout_currency, payout_amount)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select(`
            id,
            incoming_amount_thb,
            fees,
            transaction_date,
            exchange_rate_mmk,
            payout_currency,
            payout_amount,
            clients (id, name, commission_percentage, preferred_payout_currency)
          `),
      ]);

      if (invoicesResult.error) throw invoicesResult.error;
      if (allTransactionsResult.error) throw allTransactionsResult.error;

      const invoicesData = (invoicesResult.data || []) as unknown as Invoice[];
      const allTransactions = allTransactionsResult.data || [];
      
      // Filter out transactions that already have invoices
      const invoicedTransactionIds = new Set(invoicesData.map(inv => (inv as any).transaction_id));
      const availableTransactions = allTransactions.filter(t => !invoicedTransactionIds.has(t.id));

      setInvoices(invoicesData);
      setTransactions(availableTransactions);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    if (!selectedTransaction) return;

    setLoading(true);
    try {
      const transaction = transactions.find((t) => t.id === selectedTransaction);
      if (!transaction) throw new Error("Transaction not found");

      const commissionAmount = (transaction.incoming_amount_thb * transaction.clients.commission_percentage) / 100;
      const netAmount = transaction.incoming_amount_thb - commissionAmount - transaction.fees;

      const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

      const { error } = await supabase.from("invoices").insert([
        {
          client_id: transaction.clients.id,
          transaction_id: transaction.id,
          invoice_number: invoiceNumber,
          total_amount: transaction.incoming_amount_thb,
          commission_amount: commissionAmount,
          net_amount: netAmount,
        },
      ]);

      if (error) throw error;

      toast({ title: "Success", description: "Invoice generated successfully" });
      setOpen(false);
      setSelectedTransaction("");
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Colors
    const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo
    const accentColor: [number, number, number] = [139, 92, 246]; // Purple
    const textColor: [number, number, number] = [30, 41, 59]; // Slate
    const mutedColor: [number, number, number] = [100, 116, 139]; // Slate-500
    
    // Add watermark (simplified for compatibility)
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.text("PAING THU", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    
    // Header with gradient effect
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");
    
    // Company name/logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 20, 25);
    
    // Invoice number
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.invoice_number, 20, 33);
    
    // Date on the right
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(invoice.created_at), "MMMM dd, yyyy")}`, 150, 25);
    
    // Bill To section
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(invoice.clients.name, 20, 63);
    
    let yPos = 70;
    if (invoice.clients.phone) {
      doc.setFontSize(10);
      doc.setTextColor(...mutedColor);
      doc.text(`Phone: ${invoice.clients.phone}`, 20, yPos);
      yPos += 6;
    }
    
    // Display all bank accounts
    if (invoice.clients.bank_account && Array.isArray(invoice.clients.bank_account) && invoice.clients.bank_account.length > 0) {
      invoice.clients.bank_account.forEach((account) => {
        doc.text(`${account.bank_name}: ${account.account_number}`, 20, yPos);
        yPos += 6;
      });
    }
    
    // Transaction details section
    yPos += 10;
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACTION DETAILS", 20, yPos);
    
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    doc.text(`Transaction Date: ${format(new Date(invoice.transactions.transaction_date), "MMMM dd, yyyy")}`, 20, yPos);
    
    yPos += 6;
    if (invoice.transactions.exchange_rate_mmk > 0) {
      doc.text(`Exchange Rate: 1 THB = ${invoice.transactions.exchange_rate_mmk.toFixed(2)} MMK`, 20, yPos);
      yPos += 6;
    }
    doc.text(`Payout Currency: ${invoice.transactions.payout_currency}`, 20, yPos);
    
    // Table for amounts
    yPos += 15;
    doc.setDrawColor(...mutedColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 8;
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, yPos);
    doc.text("Amount", 170, yPos, { align: "right" });
    
    yPos += 2;
    doc.line(20, yPos, 190, yPos);
    
    // Line items
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    doc.text("Incoming Amount (THB)", 20, yPos);
    doc.text(invoice.total_amount.toFixed(2), 170, yPos, { align: "right" });
    
    yPos += 7;
    doc.setTextColor(...mutedColor);
    doc.text(`Commission (${invoice.clients.commission_percentage}%)`, 20, yPos);
    doc.setTextColor(220, 38, 38); // Red for deductions
    doc.text(`-${invoice.commission_amount.toFixed(2)}`, 170, yPos, { align: "right" });
    
    yPos += 7;
    doc.setTextColor(...mutedColor);
    doc.text("Processing Fees", 20, yPos);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${invoice.transactions.fees.toFixed(2)}`, 170, yPos, { align: "right" });
    
    yPos += 7;
    doc.setTextColor(...mutedColor);
    doc.text("Net in THB", 20, yPos);
    doc.setTextColor(...textColor);
    doc.text(invoice.net_amount.toFixed(2), 170, yPos, { align: "right" });
    
    // Currency conversion if applicable
    if (invoice.transactions.payout_currency === "MMK" && invoice.transactions.exchange_rate_mmk > 0) {
      yPos += 7;
      doc.setTextColor(...mutedColor);
      doc.text(`Conversion Rate (1 THB = ${invoice.transactions.exchange_rate_mmk.toFixed(2)} MMK)`, 20, yPos);
    }
    
    // Total
    yPos += 5;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 8;
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAYOUT AMOUNT", 20, yPos);
    doc.setTextColor(...accentColor);
    const payoutDisplay = invoice.transactions.payout_currency === "MMK" 
      ? `${invoice.transactions.payout_amount.toFixed(2)} MMK`
      : `฿${invoice.transactions.payout_amount.toFixed(2)}`;
    doc.text(payoutDisplay, 170, yPos, { align: "right" });
    
    // Company Footer
    yPos = 260;
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "bold");
    doc.text("PAING THU", 105, yPos, { align: "center" });
    
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    doc.text("+6691 333 7003 | https://www.paingthu.com", 105, yPos, { align: "center" });
    
    yPos += 5;
    doc.text("Nakhon Pathom, Thailand", 105, yPos, { align: "center" });
    
    // Thank you note in Myanmar
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "italic");
    doc.text("ကျေးဇူးအထူးတင်ရှိပါတယ် အဆင်ပြေပြီးကြီးပွားကျမ်းမာပါစေ", 105, yPos, { align: "center" });
    
    // Save PDF
    doc.save(`${invoice.invoice_number}.pdf`);
    
    toast({
      title: "Success",
      description: "Invoice PDF downloaded successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Generate and manage invoices</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} disabled={transactions.length === 0}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 && invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions available. Add transactions first to generate invoices.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices yet. Generate your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell className="font-medium">{invoice.clients.name}</TableCell>
                      <TableCell>{format(new Date(invoice.created_at), "MMM dd, yyyy")}</TableCell>
                      <TableCell>${invoice.total_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-destructive">
                        -${invoice.commission_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        ${invoice.net_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewInvoice(invoice)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadPDF(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Transaction</label>
                <Select value={selectedTransaction} onValueChange={setSelectedTransaction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a transaction" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactions.map((transaction) => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        {transaction.clients.name} - ฿{transaction.incoming_amount_thb.toFixed(2)} (
                        {format(new Date(transaction.transaction_date), "MMM dd, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={generateInvoice}
                className="w-full"
                disabled={!selectedTransaction || loading}
              >
                {loading ? "Generating..." : "Generate Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invoice Preview</DialogTitle>
            </DialogHeader>
            {previewInvoice && (
              <div className="space-y-6 p-6 bg-gradient-to-br from-card to-muted/20 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      INVOICE
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {previewInvoice.invoice_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(previewInvoice.created_at), "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">BILL TO</p>
                  <p className="font-semibold text-lg">{previewInvoice.clients.name}</p>
                  {previewInvoice.clients.phone && (
                    <p className="text-sm text-muted-foreground">{previewInvoice.clients.phone}</p>
                  )}
                  {previewInvoice.clients.bank_account && Array.isArray(previewInvoice.clients.bank_account) && previewInvoice.clients.bank_account.length > 0 && (
                    <div className="space-y-1">
                      {previewInvoice.clients.bank_account.map((account, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {account.bank_name}: {account.account_number}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Incoming Amount (THB)</span>
                    <span className="font-medium">฿{previewInvoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Commission ({previewInvoice.clients.commission_percentage}%)
                    </span>
                    <span className="font-medium text-destructive">
                      -฿{previewInvoice.commission_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-medium text-destructive">
                      -฿{previewInvoice.transactions.fees.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net (THB)</span>
                    <span className="font-medium">฿{previewInvoice.net_amount.toFixed(2)}</span>
                  </div>
                  {previewInvoice.transactions.payout_currency === "MMK" && previewInvoice.transactions.exchange_rate_mmk > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Exchange Rate: 1 THB = {previewInvoice.transactions.exchange_rate_mmk.toFixed(2)} MMK
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-lg font-bold">Payout Amount</span>
                    <span className="text-lg font-bold text-primary">
                      {previewInvoice.transactions.payout_currency === "MMK" 
                        ? `${previewInvoice.transactions.payout_amount.toFixed(2)} MMK`
                        : `฿${previewInvoice.transactions.payout_amount.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InvoicesTab;
