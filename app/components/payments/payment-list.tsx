"use client";

import { format } from "date-fns";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { usePayments } from "../../hooks/use-payments";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

export default function PaymentList() {
  const { payments, isLoading, markAsPaid } = usePayments();

  const formatCurrency = (amount: number) => {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }

    // Simple deterministic formatting to avoid hydration issues
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} €`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "OVERDUE":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Nessun pagamento trovato
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          I pagamenti appariranno qui una volta creati gli abbonamenti.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusIcon(payment.status)}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {payment.subscription.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Scadenza: {format(new Date(payment.dueDate), "dd MMM yyyy")}
                  </p>
                  {payment.paidDate && (
                    <p className="text-sm text-gray-500">
                      Pagato:{" "}
                      {format(new Date(payment.paidDate), "dd MMM yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {formatCurrency(payment.amount)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      payment.status,
                    )}`}
                  >
                    {payment.status}
                  </span>
                </div>

                {payment.status === "PENDING" && (
                  <Button size="sm" onClick={() => markAsPaid(payment.id)}>
                    Segna come Pagato
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
