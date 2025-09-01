"use client";

import { Calendar, CreditCard, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
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
  dashboardData: {
    subscriptions: any[];
    monthlyTotal: number;
    yearlyTotal: number;
    totalByType: Record<string, number>;
  };
  payments: any[];
  initialFilters: {
    status?: "all" | "pending" | "paid" | "overdue";
    year: number | "all" | "current";
    page: number;
  };
}

export default function Dashboard({
  dashboardData,
  payments,
  initialFilters,
}: DashboardProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();
  const { checkPaymentNotifications } = useNotifications();

  useEffect(() => {
    // Check for payment notifications whenever payments data changes
    if (payments.length > 0) {
      checkPaymentNotifications(payments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(
      payments.map((p) => ({ id: p.id, status: p.status, dueDate: p.dueDate })),
    ),
    checkPaymentNotifications,
  ]);

  const handleSubscriptionCreated = () => {
    // Refresh the page to get updated data
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Panoramica delle tue sottoscrizioni e spese
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Abbonamento
        </Button>
      </div>

      <DashboardStats data={dashboardData} />

      <Tabs defaultValue="subscriptions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="subscriptions"
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Sottoscrizioni
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pagamenti
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
              <SubscriptionList
                subscriptions={dashboardData.subscriptions}
                onUpdate={handleSubscriptionCreated}
              />
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
