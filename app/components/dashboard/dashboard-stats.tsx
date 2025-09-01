import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface Subscription {
  id: string;
  name: string;
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER";
  amount: number;
  currency: string;
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME";
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
}

interface DashboardData {
  subscriptions: Subscription[];
  monthlyTotal: number;
  yearlyTotal: number;
  totalByType: Record<string, number>;
}

interface DashboardStatsProps {
  data: DashboardData;
}

export default function DashboardStats({ data }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    if (Number.isNaN(amount) || !Number.isFinite(amount)) {
      amount = 0;
    }
    
    // Simple deterministic formatting to avoid hydration issues
    const formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${formatted} €`;
  };

  const activeSubscriptions = data.subscriptions.filter(
    (sub) => sub.status === "ACTIVE",
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Abbonamenti Attivi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
          <p className="text-xs text-muted-foreground">
            {data.subscriptions.length} totali
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Mensile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.monthlyTotal)}
          </div>
          <p className="text-xs text-muted-foreground">
            Spese ricorrenti al mese
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Totale Annuale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(data.yearlyTotal)}
          </div>
          <p className="text-xs text-muted-foreground">Spese totali all'anno</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Categoria Più Costosa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(data.totalByType).length > 0 &&
          Object.values(data.totalByType).some(
            (val) => !Number.isNaN(val) && val > 0,
          ) ? (
            <>
              <div className="text-2xl font-bold">
                {
                  Object.entries(data.totalByType)
                    .filter(([_, value]) => !Number.isNaN(value) && value > 0)
                    .reduce((a, b) => (a[1] > b[1] ? a : b))[0]
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(
                  Math.max(
                    ...Object.values(data.totalByType).filter(
                      (val) => !Number.isNaN(val),
                    ),
                  ),
                )}
                /mese
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                Nessun dato disponibile
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
