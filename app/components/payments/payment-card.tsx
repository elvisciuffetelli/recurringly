"use client";

import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Euro,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useNotifications } from "../providers/notification-provider";
import type { Payment } from "./types";

interface PaymentCardProps {
  payment: Payment;
  onRefresh?: () => void;
  allPayments?: Payment[];
}

export default function PaymentCard({ payment, onRefresh, allPayments }: PaymentCardProps) {
  const [loadingPayments, setLoadingPayments] = useState<Set<string>>(
    new Set(),
  );
  const { checkPaymentNotifications } = useNotifications();
  
  const [localPayment, setLocalPayment] = useState(payment);
  
  // Update local payment when prop changes
  useEffect(() => {
    setLocalPayment(payment);
  }, [payment]);

  const formatCurrency = (amount: number) => {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }
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
        return "bg-green-100 text-green-800 border-green-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION":
        return "bg-blue-100 text-blue-800";
      case "TAX":
        return "bg-red-100 text-red-800";
      case "INSTALLMENT":
        return "bg-yellow-100 text-yellow-800";
      case "OTHER":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const markAsPaid = async (paymentId: string) => {
    console.log("markAsPaid called for payment:", paymentId);
    
    // Optimistically update the local state
    setLocalPayment(prev => {
      const updated = {
        ...prev,
        status: "PAID" as const,
        paidDate: new Date().toISOString(),
      };
      console.log("Updated local payment:", updated);
      return updated;
    });

    try {
      setLoadingPayments((prev) => new Set(prev).add(paymentId));

      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setLocalPayment(payment);
        console.error("Impossibile segnare il pagamento come pagato");
      } else {
        // Refresh notifications after successful payment update
        if (allPayments) {
          const updatedPayments = allPayments.map(p => 
            p.id === paymentId ? { ...p, status: "PAID" as const, paidDate: new Date().toISOString() } : p
          );
          checkPaymentNotifications(updatedPayments);
        }
        
        // Optionally trigger refresh for other components
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalPayment(payment);
      console.error("Errore nel segnare il pagamento come pagato:", error);
    } finally {
      setLoadingPayments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const markAsUnpaid = async (paymentId: string) => {
    // Optimistically update the local state
    setLocalPayment(prev => ({
      ...prev,
      status: "PENDING" as const,
      paidDate: null,
    }));

    try {
      setLoadingPayments((prev) => new Set(prev).add(paymentId));

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING",
          paidDate: null,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setLocalPayment(payment);
        const errorData = await response.json();
        console.error(
          "Impossibile segnare il pagamento come non pagato:",
          errorData,
        );
      } else {
        // Refresh notifications after successful payment update
        if (allPayments) {
          const updatedPayments = allPayments.map(p => 
            p.id === paymentId ? { ...p, status: "PENDING" as const, paidDate: null } : p
          );
          checkPaymentNotifications(updatedPayments);
        }
        
        // Optionally trigger refresh for other components
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setLocalPayment(payment);
      console.error("Errore nel segnare il pagamento come non pagato:", error);
    } finally {
      setLoadingPayments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  return (
    <Card className={`border-l-4 ${getStatusColor(localPayment.status)}`}>
      <CardContent className="p-4 sm:p-6">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="space-y-3">
            {/* Top row: Icon, name, amount */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getStatusIcon(localPayment.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {localPayment.subscription.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                      localPayment.subscription.type,
                    )}`}
                  >
                    {localPayment.subscription.type}
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900 ml-2">
                {formatCurrency(localPayment.amount)}
              </div>
            </div>
            
            {/* Middle row: Date info */}
            <div className="text-xs text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  Scade: {format(new Date(localPayment.dueDate), "dd/MM/yy")}
                </span>
                {localPayment.paidDate && (
                  <span className="ml-2">
                    • Pagato {format(new Date(localPayment.paidDate), "dd/MM/yy")}
                  </span>
                )}
              </div>
            </div>
            
            {/* Bottom row: Status and action button */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  localPayment.status,
                )}`}
              >
                {localPayment.status === "PAID" ? "PAGATO" : 
                 localPayment.status === "OVERDUE" ? "SCADUTO" : "ATTESA"}
              </span>

              {localPayment.status === "PENDING" ||
              localPayment.status === "OVERDUE" ? (
                <Button
                  size="sm"
                  onClick={() => markAsPaid(localPayment.id)}
                  disabled={loadingPayments.has(localPayment.id)}
                  className="h-7 text-xs"
                >
                  {loadingPayments.has(localPayment.id) ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ...
                    </>
                  ) : (
                    "Segna Pagato"
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsUnpaid(localPayment.id)}
                  disabled={loadingPayments.has(localPayment.id)}
                  className="h-7 text-xs"
                >
                  {loadingPayments.has(localPayment.id) ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ...
                    </>
                  ) : (
                    "Annulla"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            {getStatusIcon(localPayment.status)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {localPayment.subscription.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                    localPayment.subscription.type,
                  )}`}
                >
                  {localPayment.subscription.type}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Euro className="h-4 w-4 mr-1" />
                  <span>{formatCurrency(localPayment.amount)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Scadenza:{" "}
                    {format(new Date(localPayment.dueDate), "dd MMM yyyy")}
                  </span>
                </div>
                {localPayment.paidDate && (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>
                      Pagato:{" "}
                      {format(new Date(localPayment.paidDate), "dd MMM yyyy")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                localPayment.status,
              )}`}
            >
              {localPayment.status}
            </span>

            {localPayment.status === "PENDING" ||
            localPayment.status === "OVERDUE" ? (
              <Button
                size="sm"
                onClick={() => markAsPaid(localPayment.id)}
                disabled={loadingPayments.has(localPayment.id)}
              >
                {loadingPayments.has(localPayment.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Segnando...
                  </>
                ) : (
                  "Segna come Pagato"
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsUnpaid(localPayment.id)}
                disabled={loadingPayments.has(localPayment.id)}
              >
                {loadingPayments.has(localPayment.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Segnando...
                  </>
                ) : (
                  "Segna Non Pagato"
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}