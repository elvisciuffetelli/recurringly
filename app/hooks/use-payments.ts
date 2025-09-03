import useSWR from "swr";

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: "PENDING" | "PAID" | "OVERDUE";
  subscription: {
    id: string;
    name: string;
    currency: string;
  };
}

export function usePayments() {
  const { data, error, isLoading, mutate } = useSWR<Payment[]>("/api/payments");

  const markAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/mark-paid`, {
        method: "POST",
      });

      if (response.ok) {
        // Ricarica i dati
        mutate();
      } else {
        console.error("Impossibile segnare il pagamento come pagato");
      }
    } catch (error) {
      console.error("Errore nel segnare il pagamento come pagato:", error);
    }
  };

  return {
    payments: data || [],
    isLoading,
    isError: error,
    markAsPaid,
    refresh: mutate,
  };
}
