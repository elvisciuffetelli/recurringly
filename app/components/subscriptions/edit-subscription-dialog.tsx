"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { format } from "date-fns";
import { mutate } from "swr";

interface Subscription {
  id: string;
  name: string;
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER";
  amount: number;
  currency: string;
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME";
  startDate: string;
  endDate?: string | null;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
}

interface EditSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  subscription: Subscription | null;
}

interface FormData {
  name: string;
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER";
  amount: string;
  currency: string;
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME";
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
}

export default function EditSubscriptionDialog({
  open,
  onOpenChange,
  onSuccess,
  subscription,
}: EditSubscriptionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "SUBSCRIPTION",
    amount: "",
    currency: "EUR",
    frequency: "MONTHLY",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (subscription && open) {
      setFormData({
        name: subscription.name,
        type: subscription.type,
        amount: subscription.amount.toString(),
        currency: subscription.currency,
        frequency: subscription.frequency,
        startDate: format(new Date(subscription.startDate), "yyyy-MM-dd"),
        endDate: subscription.endDate
          ? format(new Date(subscription.endDate), "yyyy-MM-dd")
          : "",
        status: subscription.status,
      });
    }
  }, [subscription, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;

    setLoading(true);

    try {
      // Costruiamo il payload omettendo campi vuoti
      const payload: any = {
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        frequency: formData.frequency,
        startDate: new Date(formData.startDate).toISOString(),
        status: formData.status,
      };

      // Aggiungi endDate solo se ha un valore
      if (formData.endDate && formData.endDate.trim() !== '') {
        payload.endDate = new Date(formData.endDate).toISOString();
      }
      
      console.log("Edit payload:", payload);

      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Aggiorna i dati in cache
        mutate("/api/subscriptions");
        
        // Invalida anche i dati della dashboard
        mutate("/api/dashboard");
        
        // Forza un refresh dei dati server-side per aggiornare i pagamenti
        router.refresh();
        
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        console.error("Errore nell'aggiornamento dell'abbonamento:", error);
        alert("Failed to update subscription. Please try again.");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dell'abbonamento:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Abbonamento</DialogTitle>
          <DialogDescription>
            Aggiorna i dettagli del tuo abbonamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Netflix, Spotify, etc."
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateFormData("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBSCRIPTION">Abbonamento</SelectItem>
                  <SelectItem value="TAX">Tassa</SelectItem>
                  <SelectItem value="INSTALLMENT">Rata</SelectItem>
                  <SelectItem value="OTHER">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="amount">Importo</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="9.99"
                  value={formData.amount}
                  onChange={(e) => updateFormData("amount", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Valuta</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => updateFormData("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequenza</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => updateFormData("frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Settimanale</SelectItem>
                  <SelectItem value="MONTHLY">Mensile</SelectItem>
                  <SelectItem value="QUARTERLY">Trimestrale</SelectItem>
                  <SelectItem value="YEARLY">Annuale</SelectItem>
                  <SelectItem value="ONE_TIME">Una tantum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="startDate">Data Inizio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData("startDate", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">Data Fine (Opzionale)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormData("endDate", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Stato</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateFormData("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Attivo</SelectItem>
                  <SelectItem value="CANCELLED">Cancellato</SelectItem>
                  <SelectItem value="EXPIRED">Scaduto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Aggiornamento..." : "Aggiorna Abbonamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
