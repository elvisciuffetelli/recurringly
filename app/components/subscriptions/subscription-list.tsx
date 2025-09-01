"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Edit, Trash2, Calendar, Euro } from "lucide-react"
import { format } from "date-fns"
import EditSubscriptionDialog from "./edit-subscription-dialog"
import { useSubscriptions } from "../../hooks/use-subscriptions"

export default function SubscriptionList() {
  const { subscriptions, deleteSubscription } = useSubscriptions()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }
    
    // Simple deterministic formatting to avoid hydration issues
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} €`;
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "MONTHLY":
        return "Mensile"
      case "YEARLY":
        return "Annuale"
      case "WEEKLY":
        return "Settimanale"
      case "QUARTERLY":
        return "Trimestrale"
      case "ONE_TIME":
        return "Una tantum"
      default:
        return frequency
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUBSCRIPTION":
        return "bg-blue-100 text-blue-800"
      case "TAX":
        return "bg-red-100 text-red-800"
      case "INSTALLMENT":
        return "bg-yellow-100 text-yellow-800"
      case "OTHER":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "EXPIRED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun abbonamento</h3>
        <p className="mt-1 text-sm text-gray-500">
          Inizia creando il tuo primo abbonamento.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-medium text-gray-900 truncate">
                      {subscription.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          subscription.type
                        )}`}
                      >
                        {subscription.type}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Euro className="h-4 w-4 mr-1" />
                    <span>
                      {formatCurrency(subscription.amount)} / {getFrequencyLabel(subscription.frequency)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Iniziato {format(new Date(subscription.startDate), "dd MMM yyyy")}</span>
                  </div>
                  {subscription.endDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Termina {format(new Date(subscription.endDate), "dd MMM yyyy")}</span>
                    </div>
                  )}
                </div>

                {subscription.payments && subscription.payments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Pagamenti Recenti:</p>
                    <div className="mt-2 space-y-1">
                      {subscription.payments.slice(0, 3).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-xs text-gray-500"
                        >
                          <span>
                            Scadenza: {format(new Date(payment.dueDate), "dd MMM yyyy")}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === "PAID"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "OVERDUE"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubscription(subscription)
                    setEditDialogOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSubscription(subscription.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <EditSubscriptionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false)
          setSelectedSubscription(null)
        }}
        subscription={selectedSubscription}
      />
    </div>
  )
}