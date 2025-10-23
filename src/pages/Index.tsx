import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { FileText, Users, Receipt, TrendingUp } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authApi.me();
        navigate("/dashboard");
      } catch {
        // user not authenticated
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4 shadow-lg">
              <FileText className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
              Invoice Generator
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Professional invoice management system for tracking clients, transactions, and generating beautiful invoices
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Sign In
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
            <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all">
              <Users className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Client Management</h3>
              <p className="text-sm text-muted-foreground">
                Manage unlimited clients with custom commission rates
              </p>
            </div>
            <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all">
              <Receipt className="w-12 h-12 text-accent mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Transaction Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Track all transactions with automatic calculations
              </p>
            </div>
            <div className="p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all">
              <TrendingUp className="w-12 h-12 text-primary mb-4 mx-auto" />
              <h3 className="text-lg font-semibold mb-2">Professional Invoices</h3>
              <p className="text-sm text-muted-foreground">
                Generate and download polished invoices instantly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
