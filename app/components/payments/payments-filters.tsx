"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useAvailableYears } from "../../hooks/use-available-years";
import { Button } from "../ui/button";
import type { PaymentsFilters } from "./types";

interface Props {
  initialFilters: PaymentsFilters;
}

export default function PaymentsFilters({ initialFilters }: Props) {
  const [filter, setFilter] = useQueryState(
    "status",
    parseAsString
      .withDefault(initialFilters.status || "all")
      .withOptions({ shallow: false }),
  );

  const [yearFilter, setYearFilter] = useQueryState(
    "year",
    parseAsString
      .withDefault(String(initialFilters.year))
      .withOptions({ shallow: false }),
  );

  const [, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger
      .withDefault(initialFilters.page)
      .withOptions({ shallow: false }),
  );

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  
  const parsedYearFilter =
    yearFilter === "all" || yearFilter === "current"
      ? yearFilter
      : parseInt(yearFilter, 10);

  const availableYears = useAvailableYears();

  // Reset to first page when filters change
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleYearFilterChange = (newYearFilter: string) => {
    setYearFilter(newYearFilter);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("all")}
        >
          Tutti
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("pending")}
        >
          In Sospeso
        </Button>
        <Button
          variant={filter === "paid" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("paid")}
        >
          Pagato
        </Button>
        <Button
          variant={filter === "overdue" ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilterChange("overdue")}
        >
          In Ritardo
        </Button>
      </div>

      {/* Year Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={parsedYearFilter === "current" ? "default" : "outline"}
          size="sm"
          onClick={() => handleYearFilterChange("current")}
        >
          Corrente e Prossimo ({currentYear}-{nextYear})
        </Button>
        <Button
          variant={parsedYearFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleYearFilterChange("all")}
        >
          Tutti gli Anni
        </Button>
        {availableYears.map((year) => (
          <Button
            key={year}
            variant={parsedYearFilter === year ? "default" : "outline"}
            size="sm"
            onClick={() => handleYearFilterChange(String(year))}
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );
}