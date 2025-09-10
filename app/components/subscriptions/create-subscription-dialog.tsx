"use client";

import { useState } from "react";
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

interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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

export default function CreateSubscriptionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSubscriptionDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
      };

      const response = await fetch("/api/subscriptions", {
        method: "POST",
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
        
        // Reset form
        setFormData({
          name: "",
          type: "SUBSCRIPTION",
          amount: "",
          currency: "EUR",
          frequency: "MONTHLY",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: "",
          status: "ACTIVE",
        });
        onOpenChange(false);
        onSuccess();
      } else {
        const error = await response.json();
        console.error("Errore nella creazione dell'abbonamento:", error);
        alert("Impossibile creare l'abbonamento. Riprova.");
      }
    } catch (error) {
      console.error("Errore nella creazione dell'abbonamento:", error);
      alert("Si è verificato un errore. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Abbonamento</DialogTitle>
          <DialogDescription>
            Aggiungi un nuovo abbonamento per tracciare le tue spese ricorrenti.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Netflix, Spotify, ecc."
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
                    <SelectValue placeholder="Valuta" />
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
                  <SelectValue placeholder="Seleziona frequenza" />
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
                  <SelectValue placeholder="Seleziona stato" />
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
              {loading ? "Creazione..." : "Crea Abbonamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
