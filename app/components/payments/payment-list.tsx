"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate?: string | null
  status: "PENDING" | "PAID" | "OVERDUE"
  subscription: {
    id: string
    name: string
    currency: string
  }
}

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/payments")
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
      })

      if (response.ok) {
        // Refresh payments list
        fetchPayments()
      } else {
        console.error("Failed to mark payment as paid")
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error)
    }
  }

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "OVERDUE":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Payments will appear here once you create subscriptions.
        </p>
      </div>
    )
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
                    Due: {format(new Date(payment.dueDate), "MMM dd, yyyy")}
                  </p>
                  {payment.paidDate && (
                    <p className="text-sm text-gray-500">
                      Paid: {format(new Date(payment.paidDate), "MMM dd, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {formatCurrency(payment.amount, payment.subscription.currency)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      payment.status
                    )}`}
                  >
                    {payment.status}
                  </span>
                </div>

                {payment.status === "PENDING" && (
                  <Button
                    size="sm"
                    onClick={() => markAsPaid(payment.id)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}