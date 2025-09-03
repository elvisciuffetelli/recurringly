"use client";

import { Calendar, CreditCard, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import DashboardStats from "./dashboard/dashboard-stats";
import PaymentsView from "./payments/payments-view";
import { useNotifications } from "./providers/notification-provider";
import CreateSubscriptionDialog from "./subscriptions/create-subscription-dialog";
import SubscriptionList from "./subscriptions/subscription-list";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface DashboardProps {
  payments: any[];
  initialFilters: {
    status?: "all" | "pending" | "paid" | "overdue";
    year: number | "all" | "current";
    page: number;
  };
}

export default function Dashboard({
  payments,
  initialFilters,
}: DashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { checkPaymentNotifications } = useNotifications();

  useEffect(() => {
    // Check for payment notifications whenever payments data changes
    if (payments.length > 0) {
      checkPaymentNotifications(payments);
    }
  }, [payments, checkPaymentNotifications]);

  const handleSubscriptionCreated = () => {
    // SWR si occuperà automaticamente dell'aggiornamento
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Panoramica delle tue sottoscrizioni e spese
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="sm:hidden">Nuovo</span>
          <span className="hidden sm:inline">Aggiungi Abbonamento</span>
        </Button>
      </div>

      <DashboardStats />

      <Tabs defaultValue="subscriptions" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Sottoscrizioni</span>
            <span className="xs:hidden">Abb.</span>
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Pagamenti</span>
            <span className="xs:hidden">Pag.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Le tue Sottoscrizioni</CardTitle>
              <CardDescription>
                Gestisci le tue spese ricorrenti e abbonamenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsView
            payments={payments}
            onRefresh={handleSubscriptionCreated}
            initialFilters={initialFilters}
          />
        </TabsContent>
      </Tabs>

      <CreateSubscriptionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleSubscriptionCreated}
      />
    </div>
  );
}
