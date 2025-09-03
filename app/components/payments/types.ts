export interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: "PENDING" | "PAID" | "OVERDUE";
  subscription: {
    id: string;
    name: string;
    currency: string;
    type: string;
  };
}

export interface PaymentsFilters {
  status?: "all" | "pending" | "paid" | "overdue";
  year: number | "all" | "current";
  page: number;
}