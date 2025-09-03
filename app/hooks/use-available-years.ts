import useSWR from "swr";
import { getYear } from "date-fns";

interface Payment {
  id: string;
  dueDate: string;
}

export function useAvailableYears() {
  const { data: allPayments } = useSWR<Payment[]>("/api/payments?all=true");

  const availableYears = allPayments
    ? Array.from(
        new Set(
          allPayments.map((payment) => getYear(new Date(payment.dueDate))),
        ),
      ).sort()
    : [];

  return availableYears;
}
