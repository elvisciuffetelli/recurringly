"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, Calendar, Euro, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import EditSubscriptionDialog from "../../components/subscriptions/edit-subscription-dialog";

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  createdAt: string;
}

interface Subscription {
  id: string;
  name: string;
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER";
  amount: number;
  currency: string;
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME";
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  payments: Payment[];
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setSubscription({
            ...data,
            amount: Number(data.amount),
            payments: data.payments.map((payment: any) => ({
              ...payment,
              amount: Number(payment.amount),
            })),
          });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSubscription();
    }
  }, [params.id]);

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} €`;
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "MONTHLY":
        return "Mensile";
      case "YEARLY":
        return "Annuale";
      case "WEEKLY":
        return "Settimanale";
      case "QUARTERLY":
        return "Trimestrale";
      case "ONE_TIME":
        return "Una tantum";
      default:
        return frequency;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const deleteSubscription = async () => {
    if (!subscription) return;
    
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle sottoscrizioni
        </Button>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sottoscrizione non trovata
          </h1>
          <p className="text-gray-500">
            La sottoscrizione che stai cercando non esiste o non hai i permessi per visualizzarla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Torna alle sottoscrizioni
      </Button>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{subscription.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                      subscription.type,
                    )}`}
                  >
                    {subscription.type}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      subscription.status,
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
                <Button
                  variant="outline"
                  onClick={deleteSubscription}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Euro className="h-4 w-4 mr-2 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(subscription.amount)} / {getFrequencyLabel(subscription.frequency)}
                  </p>
                  <p>Importo</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {format(new Date(subscription.startDate), "dd MMM yyyy")}
                  </p>
                  <p>Data di inizio</p>
                </div>
              </div>
              {subscription.endDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(subscription.endDate), "dd MMM yyyy")}
                    </p>
                    <p>Data di fine</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagamenti ({subscription.payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription.payments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nessun pagamento
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Non ci sono ancora pagamenti per questa sottoscrizione.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscription.payments
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Scadenza: {format(new Date(payment.dueDate), "dd MMM yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            payment.status,
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditSubscriptionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          window.location.reload();
        }}
        subscription={subscription}
      />
    </div>
  );
}