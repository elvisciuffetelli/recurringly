"use client";

import { Euro, Info } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface PaymentsEmptyStateProps {
  filter: string;
}

export default function PaymentsEmptyState({ filter }: PaymentsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Euro className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nessun pagamento trovato
        </h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          {filter === "all"
            ? "I pagamenti appariranno qui automaticamente quando crei abbonamenti."
            : `Nessun pagamento ${
                filter === "pending"
                  ? "in sospeso"
                  : filter === "paid"
                    ? "pagato"
                    : filter === "overdue"
                      ? "in ritardo"
                      : filter
              } al momento.`}
        </p>
        {filter === "all" && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Info className="h-4 w-4" />
            <span>
              I pagamenti vengono generati automaticamente dagli abbonamenti
              attivi
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}