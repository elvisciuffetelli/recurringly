"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Edit, Trash2, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"
import EditSubscriptionDialog from "./edit-subscription-dialog"

interface Subscription {
  id: string
  name: string
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER"
  amount: number
  currency: string
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME"
  startDate: string
  endDate?: string | null
  status: "ACTIVE" | "CANCELLED" | "EXPIRED"
  createdAt: string
  updatedAt: string
  payments?: Array<{
    id: string
    amount: number
    dueDate: string
    paidDate?: string | null
    status: "PENDING" | "PAID" | "OVERDUE"
  }>
}

interface SubscriptionListProps {
  subscriptions: Subscription[]
  onUpdate: () => void
}

export default function SubscriptionList({ subscriptions: initialSubscriptions, onUpdate }: SubscriptionListProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)

  useEffect(() => {
    setSubscriptions(initialSubscriptions)
  }, [initialSubscriptions])


  const deleteSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) {
      return
    }

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSubscriptions(subscriptions.filter(sub => sub.id !== id))
        onUpdate()
      } else {
        console.error("Failed to delete subscription")
      }
    } catch (error) {
      console.error("Error deleting subscription:", error)
    }
  }

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "MONTHLY":
        return "Monthly"
      case "YEARLY":
        return "Yearly"
      case "WEEKLY":
        return "Weekly"
      case "QUARTERLY":
        return "Quarterly"
      case "ONE_TIME":
        return "One-time"
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first subscription.
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
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>
                      {formatCurrency(subscription.amount, subscription.currency)} / {getFrequencyLabel(subscription.frequency)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Started {format(new Date(subscription.startDate), "MMM dd, yyyy")}</span>
                  </div>
                  {subscription.endDate && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Ends {format(new Date(subscription.endDate), "MMM dd, yyyy")}</span>
                    </div>
                  )}
                </div>

                {subscription.payments && subscription.payments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Recent Payments:</p>
                    <div className="mt-2 space-y-1">
                      {subscription.payments.slice(0, 3).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-xs text-gray-500"
                        >
                          <span>
                            Due: {format(new Date(payment.dueDate), "MMM dd, yyyy")}
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
          onUpdate()
        }}
        subscription={selectedSubscription}
      />
    </div>
  )
}