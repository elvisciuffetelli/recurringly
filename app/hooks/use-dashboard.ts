import useSWR from "swr";

interface DashboardData {
  subscriptions: Array<{
    id: string;
    name: string;
    type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER";
    amount: number;
    currency: string;
    frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME";
    status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  }>;
  monthlyTotal: number;
  yearlyTotal: number;
  totalByType: Record<string, number>;
}

export function useDashboard() {
  const { data, error, isLoading, mutate } =
    useSWR<DashboardData>("/api/dashboard");

  return {
    dashboardData: data || {
      subscriptions: [],
      monthlyTotal: 0,
      yearlyTotal: 0,
      totalByType: {},
    },
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
