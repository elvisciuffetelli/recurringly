import useSWR from "swr";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  name: string;
  type: "SUBSCRIPTION" | "TAX" | "INSTALLMENT" | "OTHER";
  amount: number;
  currency: string;
  frequency: "MONTHLY" | "YEARLY" | "WEEKLY" | "QUARTERLY" | "ONE_TIME";
  startDate: string;
  endDate?: string | null;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
  payments?: Array<{
    id: string;
    amount: number;
    dueDate: string;
    paidDate?: string | null;
    status: "PENDING" | "PAID" | "OVERDUE";
  }>;
}

export function useSubscriptions() {
  const { data, error, isLoading, mutate } =
    useSWR<Subscription[]>("/api/subscriptions");
  const router = useRouter();

  const deleteSubscription = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo abbonamento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Ricarica i dati delle sottoscrizioni
        mutate();
        
        // Forza un refresh dei dati server-side per aggiornare i pagamenti
        router.refresh();
      } else {
        console.error("Impossibile eliminare l'abbonamento");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione dell'abbonamento:", error);
    }
  };

  return {
    subscriptions: data || [],
    isLoading,
    isError: error,
    deleteSubscription,
    refresh: mutate,
  };
}
