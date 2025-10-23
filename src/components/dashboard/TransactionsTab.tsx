import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { clientsApi, transactionsApi } from "@/lib/api";
import type { Client, Transaction } from "@/lib/types";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    incoming_amount_thb: "",
    fees: "",
    exchange_rate_mmk: "",
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsData, clientsData] = await Promise.all([
        transactionsApi.list(),
        clientsApi.list()
      ]);

      setTransactions((transactionsData || []) as Transaction[]);
      setClients((clientsData || []) as Client[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load transactions";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transactionData = {
        client_id: formData.client_id,
        incoming_amount_thb: parseFloat(formData.incoming_amount_thb),
        fees: parseFloat(formData.fees || "0"),
        exchange_rate_mmk: parseFloat(formData.exchange_rate_mmk || "0"),
        transaction_date: formData.transaction_date,
        notes: formData.notes || null,
      };

      await transactionsApi.create(transactionData);

      toast({ title: "Success", description: "Transaction added successfully" });
      setOpen(false);
      setFormData({
        client_id: "",
        incoming_amount_thb: "",
        fees: "",
        exchange_rate_mmk: "",
        transaction_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save transaction";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Track all client transactions</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={clients.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} ({client.commission_percentage}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incoming_amount_thb">Incoming Amount (THB) *</Label>
                  <Input
                    id="incoming_amount_thb"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.incoming_amount_thb}
                    onChange={(e) => setFormData({ ...formData, incoming_amount_thb: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fees">Fees (THB)</Label>
                  <Input
                    id="fees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fees}
                    onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange_rate_mmk">Exchange Rate (1 THB to MMK) *</Label>
                  <Input
                    id="exchange_rate_mmk"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.exchange_rate_mmk}
                    onChange={(e) => setFormData({ ...formData, exchange_rate_mmk: e.target.value })}
                    required
                    placeholder="e.g., 120.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Transaction Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Add Transaction"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Please add clients first before creating transactions.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Incoming (THB)</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Payout Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No transactions yet. Add your first transaction to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.transaction_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{transaction.clients.name}</TableCell>
                      <TableCell>฿{Number(transaction.incoming_amount_thb).toFixed(2)}</TableCell>
                      <TableCell>
                        {transaction.exchange_rate_mmk > 0
                          ? `1:${Number(transaction.exchange_rate_mmk).toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell>฿{Number(transaction.fees).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {transaction.payout_currency === "MMK"
                          ? `${Number(transaction.payout_amount ?? 0).toFixed(2)} MMK`
                          : `฿${Number(transaction.payout_amount ?? 0).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;
