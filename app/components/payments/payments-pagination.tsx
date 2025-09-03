"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { Button } from "../ui/button";

interface PaymentsPaginationProps {
  totalPayments: number;
  paymentsPerPage: number;
  initialPage: number;
}

export default function PaymentsPagination({
  totalPayments,
  paymentsPerPage,
  initialPage,
}: PaymentsPaginationProps) {
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger
      .withDefault(initialPage)
      .withOptions({ shallow: false }),
  );

  const totalPages = Math.ceil(totalPayments / paymentsPerPage);
  const startIndex = (currentPage - 1) * paymentsPerPage;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Mobile pagination info */}
      <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
        {startIndex + 1}-{Math.min(startIndex + paymentsPerPage, totalPayments)} di {totalPayments}
      </div>
      
      {/* Mobile pagination controls */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prec
          </Button>
          
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium">
              {currentPage}
            </span>
            <span className="text-sm text-gray-400">di</span>
            <span className="text-sm text-gray-600">
              {totalPages}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex-1"
          >
            Succ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Desktop pagination controls */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + paymentsPerPage, totalPayments)} of{" "}
          {totalPayments} payments
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
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber: number;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else {
                const start = Math.max(1, currentPage - 2);
                const end = Math.min(totalPages, start + 4);
                pageNumber = start + i;
                if (pageNumber > end) return null;
              }
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            }).filter(Boolean)}
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
    </div>
  );
}