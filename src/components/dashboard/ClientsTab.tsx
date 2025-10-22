import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface BankAccount {
  bank_name: string;
  account_number: string;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
  bank_account: BankAccount[] | null;
  commission_percentage: number;
  preferred_payout_currency: string;
}

const ClientsTab = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    commission_percentage: "0",
    preferred_payout_currency: "THB",
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [newBank, setNewBank] = useState({ bank_name: "", account_number: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients((data || []) as unknown as Client[]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const clientData = {
        name: formData.name,
        phone: formData.phone || null,
        bank_account: bankAccounts.length > 0 ? (bankAccounts as any) : null,
        commission_percentage: parseFloat(formData.commission_percentage),
        preferred_payout_currency: formData.preferred_payout_currency,
        user_id: user.id,
      };

      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(clientData)
          .eq("id", editingClient.id);
        if (error) throw error;
        toast({ title: "Success", description: "Client updated successfully" });
      } else {
        const { error } = await supabase.from("clients").insert([clientData]);
        if (error) throw error;
        toast({ title: "Success", description: "Client added successfully" });
      }

      setOpen(false);
      setEditingClient(null);
      setFormData({ name: "", phone: "", commission_percentage: "0", preferred_payout_currency: "THB" });
      setBankAccounts([]);
      setNewBank({ bank_name: "", account_number: "" });
      fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || "",
      commission_percentage: client.commission_percentage.toString(),
      preferred_payout_currency: client.preferred_payout_currency || "THB",
    });
    setBankAccounts(client.bank_account || []);
    setOpen(true);
  };

  const addBankAccount = () => {
    if (newBank.bank_name.trim() && newBank.account_number.trim()) {
      setBankAccounts([...bankAccounts, newBank]);
      setNewBank({ bank_name: "", account_number: "" });
    }
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Client deleted successfully" });
      fetchClients();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clients</CardTitle>
            <CardDescription>Manage your client information</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingClient(null);
                setFormData({ name: "", phone: "", commission_percentage: "0", preferred_payout_currency: "THB" });
                setBankAccounts([]);
                setNewBank({ bank_name: "", account_number: "" });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Accounts</Label>
                  <div className="space-y-2">
                    {bankAccounts.map((account, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{account.bank_name}</p>
                          <p className="text-xs text-muted-foreground">{account.account_number}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBankAccount(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Bank Name (e.g., KBANK)"
                        value={newBank.bank_name}
                        onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                      />
                      <Input
                        placeholder="Account Number"
                        value={newBank.account_number}
                        onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                      />
                      <Button type="button" variant="outline" onClick={addBankAccount}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission % *</Label>
                  <Input
                    id="commission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Preferred Payout Currency *</Label>
                  <Select
                    value={formData.preferred_payout_currency}
                    onValueChange={(value) => setFormData({ ...formData, preferred_payout_currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">THB (Thai Baht)</SelectItem>
                      <SelectItem value="MMK">MMK (Myanmar Kyat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editingClient ? "Update Client" : "Add Client"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Bank Account</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No clients yet. Add your first client to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.phone || "—"}</TableCell>
                      <TableCell>
                        {client.bank_account && Array.isArray(client.bank_account) && client.bank_account.length > 0 ? (
                          <div className="space-y-1">
                            {client.bank_account.map((account, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{account.bank_name}:</span> {account.account_number}
                              </div>
                            ))}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{client.commission_percentage}%</TableCell>
                      <TableCell>{client.preferred_payout_currency}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientsTab;
