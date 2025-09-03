"use client";

import { endOfMonth, isAfter, startOfMonth } from "date-fns";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { Payment } from "./types";

interface PaymentsSummaryProps {
  payments: Payment[];
}

export default function PaymentsSummary({ payments }: PaymentsSummaryProps) {
  const formatCurrency = (amount: number) => {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} €`;
  };

  const summaryData = useMemo(() => {
    const now = new Date();
    
    const currentMonthPayments = payments.filter((payment) => {
      const dueDate = new Date(payment.dueDate);
      return dueDate >= startOfMonth(now) && dueDate <= endOfMonth(now);
    });

    const upcomingPayments = payments.filter((payment) => {
      const dueDate = new Date(payment.dueDate);
      return isAfter(dueDate, now) && payment.status === "PENDING";
    });

    const overduePayments = payments.filter(
      (payment) => payment.status === "OVERDUE",
    );

    return {
      currentMonthPayments,
      upcomingPayments,
      overduePayments,
    };
  }, [payments]);

  const { currentMonthPayments, upcomingPayments, overduePayments } = summaryData;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Questo Mese</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">
            {currentMonthPayments.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(
              currentMonthPayments.reduce(
                (sum, p) => sum + Number(p.amount),
                0,
              ),
            )}{" "}
            totale
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">In Arrivo</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{upcomingPayments.length}</div>
          <p className="text-xs text-muted-foreground">
            Pagamenti in sospeso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">In Ritardo</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {overduePayments.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(
              overduePayments.reduce((sum, p) => sum + Number(p.amount), 0),
            )}{" "}
            totale
          </p>
        </CardContent>
      </Card>
    </div>
  );
}