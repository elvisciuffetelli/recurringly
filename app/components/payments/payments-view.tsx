"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useMemo } from "react";
import PaymentCard from "./payment-card";
import PaymentsEmptyState from "./payments-empty-state";
import PaymentsFiltersComponent from "./payments-filters";
import PaymentsHeader from "./payments-header";
import PaymentsPagination from "./payments-pagination";
import PaymentsSummary from "./payments-summary";
import type { Payment, PaymentsFilters } from "./types";

interface PaymentsViewProps {
  payments: Payment[];
  onRefresh?: () => void;
  initialFilters: PaymentsFilters;
}

export default function PaymentsView({
  payments,
  onRefresh,
  initialFilters,
}: PaymentsViewProps) {
  const [currentPage] = useQueryState(
    "page",
    parseAsInteger
      .withDefault(initialFilters.page)
      .withOptions({ shallow: false }),
  );

  const [filter] = useQueryState(
    "status",
    parseAsString
      .withDefault(initialFilters.status || "all")
      .withOptions({ shallow: false }),
  );

  const paymentsPerPage = 12;

  // Memoized pagination calculation
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * paymentsPerPage;
    return payments.slice(startIndex, startIndex + paymentsPerPage);
  }, [payments, currentPage]);

  return (
    <div className="space-y-6">
      <PaymentsHeader onRefresh={onRefresh} />
      
      <PaymentsSummary payments={payments} />
      
      <PaymentsFiltersComponent initialFilters={initialFilters} />

      {payments.length === 0 ? (
        <PaymentsEmptyState filter={filter} />
      ) : (
        <div className="space-y-4">
          {paginatedPayments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} onRefresh={onRefresh} />
          ))}

          <PaymentsPagination
            totalPayments={payments.length}
            paymentsPerPage={paymentsPerPage}
            initialPage={initialFilters.page}
          />
        </div>
      )}
    </div>
  );
}