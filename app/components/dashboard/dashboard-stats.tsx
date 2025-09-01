import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

interface Subscription {
  id: string
  name: string
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER"
  amount: number
  currency: string
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME"
  status: "ACTIVE" | "CANCELLED" | "EXPIRED"
}

interface DashboardData {
  subscriptions: Subscription[]
  monthlyTotal: number
  yearlyTotal: number
  totalByType: Record<string, number>
}

interface DashboardStatsProps {
  data: DashboardData
}

export default function DashboardStats({ data }: DashboardStatsProps) {
  const formatCurrency = (amount: number, currency: string = "EUR") => {
    if (isNaN(amount) || !isFinite(amount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(0)
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const activeSubscriptions = data.subscriptions.filter(sub => sub.status === "ACTIVE")

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
          <p className="text-xs text-muted-foreground">
            {data.subscriptions.length} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.monthlyTotal)}</div>
          <p className="text-xs text-muted-foreground">
            Recurring expenses per month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Yearly Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.yearlyTotal)}</div>
          <p className="text-xs text-muted-foreground">
            Total expenses per year
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Expensive Category</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.totalByType).length > 0 && 
           Object.values(data.totalByType).some(val => !isNaN(val) && val > 0) ? (
            <>
              <div className="text-2xl font-bold">
                {Object.entries(data.totalByType)
                  .filter(([_, value]) => !isNaN(value) && value > 0)
                  .reduce((a, b) => a[1] > b[1] ? a : b)[0]}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(Math.max(...Object.values(data.totalByType).filter(val => !isNaN(val))))}/month
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}