"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface PaymentsHeaderProps {
  onRefresh?: () => void;
}

export default function PaymentsHeader({ onRefresh }: PaymentsHeaderProps) {
  const [generatingPayments, setGeneratingPayments] = useState(false);

  const refreshPayments = async () => {
    try {
      setGeneratingPayments(true);
      const response = await fetch("/api/payments/generate", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.generatedCount > 0) {
          alert(`Refreshed and added ${data.generatedCount} new payments`);
        }
        if (onRefresh) {
          onRefresh();
        }
      } else {
        console.error("Impossibile aggiornare i pagamenti");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento dei pagamenti:", error);
    } finally {
      setGeneratingPayments(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pagamenti</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          I pagamenti vengono generati automaticamente dai tuoi abbonamenti
        </p>
      </div>
      <Button
        onClick={refreshPayments}
        disabled={generatingPayments}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 w-full sm:w-auto"
      >
        <RefreshCw
          className={`h-4 w-4 ${generatingPayments ? "animate-spin" : ""}`}
        />
        {generatingPayments ? "Aggiornamento..." : "Aggiorna"}
      </Button>
    </div>
  );
}