"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { CheckCircle, Clock, AlertCircle, RefreshCw, Calendar, DollarSign, Info, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { format, isAfter, startOfMonth, endOfMonth, getYear } from "date-fns"
import { useQueryState, parseAsString, parseAsInteger } from "nuqs"

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
    type: string
  }
}

interface PaymentsViewProps {
  payments: Payment[]
  onRefresh?: () => void
  initialFilters: {
    status?: "all" | "pending" | "paid" | "overdue"
    year: number | "all" | "current"
    page: number
  }
}

export default function PaymentsView({ payments, onRefresh, initialFilters }: PaymentsViewProps) {
  const [generatingPayments, setGeneratingPayments] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState<Set<string>>(new Set())
  
  // Use nuqs for URL state management with server-side re-rendering
  const [filter, setFilter] = useQueryState(
    "status", 
    parseAsString.withDefault(initialFilters.status || "all").withOptions({ shallow: false })
  )
  
  const [yearFilter, setYearFilter] = useQueryState(
    "year",
    parseAsString.withDefault(String(initialFilters.year)).withOptions({ shallow: false })
  )
  
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(initialFilters.page).withOptions({ shallow: false })
  )

  const paymentsPerPage = 12
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1

  // Parse year filter for computation
  const parsedYearFilter = yearFilter === "all" || yearFilter === "current" ? yearFilter : parseInt(yearFilter)

  const refreshPayments = async () => {
    try {
      setGeneratingPayments(true)
      const response = await fetch("/api/payments/generate", {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.generatedCount > 0) {
          alert(`Refreshed and added ${data.generatedCount} new payments`)
        }
        // Call parent refresh function to reload page data
        if (onRefresh) {
          onRefresh()
        }
      } else {
        console.error("Failed to refresh payments")
      }
    } catch (error) {
      console.error("Error refreshing payments:", error)
    } finally {
      setGeneratingPayments(false)
    }
  }

  const markAsPaid = async (paymentId: string) => {
    try {
      setLoadingPayments(prev => new Set(prev).add(paymentId))
      
      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
      })

      if (response.ok) {
        if (onRefresh) {
          onRefresh()
        }
      } else {
        console.error("Failed to mark payment as paid")
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error)
    } finally {
      setLoadingPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentId)
        return newSet
      })
    }
  }

  const markAsUnpaid = async (paymentId: string) => {
    try {
      setLoadingPayments(prev => new Set(prev).add(paymentId))
      
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PENDING",
          paidDate: null,
        }),
      })

      if (response.ok) {
        if (onRefresh) {
          onRefresh()
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to mark payment as unpaid:", errorData)
      }
    } catch (error) {
      console.error("Error marking payment as unpaid:", error)
    } finally {
      setLoadingPayments(prev => {
        const newSet = new Set(prev)
        newSet.delete(paymentId)
        return newSet
      })
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
        return "bg-green-100 text-green-800 border-green-200"
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
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

  // Since server has already filtered, we just use the payments directly
  // But we still need client-side pagination for performance
  const totalPages = Math.ceil(payments.length / paymentsPerPage)
  const startIndex = (currentPage - 1) * paymentsPerPage
  const paginatedPayments = payments.slice(startIndex, startIndex + paymentsPerPage)

  // Get unique years from all payments for filter buttons
  // Note: We could also pass this from server, but keeping it simple for now
  const availableYears = Array.from(new Set(
    payments.map(payment => getYear(new Date(payment.dueDate)))
  )).sort()

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, yearFilter])

  const currentMonthPayments = payments.filter(payment => {
    const dueDate = new Date(payment.dueDate)
    const now = new Date()
    return dueDate >= startOfMonth(now) && dueDate <= endOfMonth(now)
  })

  const upcomingPayments = payments.filter(payment => {
    const dueDate = new Date(payment.dueDate)
    const now = new Date()
    return isAfter(dueDate, now) && payment.status === "PENDING"
  })

  const overduePayments = payments.filter(payment => payment.status === "OVERDUE")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            Payments are automatically generated from your subscriptions
          </p>
        </div>
        <Button 
          onClick={refreshPayments}
          disabled={generatingPayments}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generatingPayments ? 'animate-spin' : ''}`} />
          {generatingPayments ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(currentMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0))} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overduePayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overduePayments.reduce((sum, p) => sum + Number(p.amount), 0))} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="space-y-4">
        {/* Status Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button 
            variant={filter === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("paid")}
          >
            Paid
          </Button>
          <Button 
            variant={filter === "overdue" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("overdue")}
          >
            Overdue
          </Button>
        </div>

        {/* Year Filters */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={parsedYearFilter === "current" ? "default" : "outline"}
            size="sm"
            onClick={() => setYearFilter("current")}
          >
            Current & Next ({currentYear}-{nextYear})
          </Button>
          <Button 
            variant={parsedYearFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setYearFilter("all")}
          >
            All Years
          </Button>
          {availableYears.map(year => (
            <Button 
              key={year}
              variant={parsedYearFilter === year ? "default" : "outline"}
              size="sm"
              onClick={() => setYearFilter(String(year))}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-sm text-gray-500 text-center mb-4">
              {filter === "all" 
                ? "Payments will appear here automatically when you create subscriptions."
                : `No ${filter} payments at the moment.`}
            </p>
            {filter === "all" && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Info className="h-4 w-4" />
                <span>Payments are auto-generated from active subscriptions</span>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paginatedPayments.map((payment) => (
            <Card key={payment.id} className={`border-l-4 ${getStatusColor(payment.status)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(payment.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {payment.subscription.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                            payment.subscription.type
                          )}`}
                        >
                          {payment.subscription.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>{formatCurrency(payment.amount, payment.subscription.currency)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>Due: {format(new Date(payment.dueDate), "MMM dd, yyyy")}</span>
                        </div>
                        {payment.paidDate && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Paid: {format(new Date(payment.paidDate), "MMM dd, yyyy")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        payment.status
                      )}`}
                    >
                      {payment.status}
                    </span>

                    {payment.status === "PENDING" || payment.status === "OVERDUE" ? (
                      <Button
                        size="sm"
                        onClick={() => markAsPaid(payment.id)}
                        disabled={loadingPayments.has(payment.id)}
                      >
                        {loadingPayments.has(payment.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          "Mark as Paid"
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsUnpaid(payment.id)}
                        disabled={loadingPayments.has(payment.id)}
                      >
                        {loadingPayments.has(payment.id) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Marking...
                          </>
                        ) : (
                          "Mark as Unpaid"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + paymentsPerPage, payments.length)} of {payments.length} payments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}