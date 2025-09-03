"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  subscription: {
    name: string;
    currency: string;
  };
}

interface Notification {
  id: string;
  type: "overdue" | "due_today" | "due_tomorrow" | "due_soon";
  title: string;
  message: string;
  payment: Payment;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt">,
  ) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  checkPaymentNotifications: (payments: Payment[]) => void;
  hasUnreadNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export default function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    notification: Omit<Notification, "id" | "createdAt">,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const checkPaymentNotifications = useCallback((payments: Payment[]) => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    const newNotifications: Notification[] = [];

    payments.forEach((payment) => {
      if (payment.status === "PAID") return;

      const dueDate = new Date(payment.dueDate);
      const amount = formatCurrency(
        payment.amount,
        payment.subscription.currency,
      );

      if (payment.status === "OVERDUE") {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: "overdue",
          title: "Payment Overdue",
          message: `${payment.subscription.name} payment of ${amount} is overdue (due ${format(dueDate, "MMM dd")})`,
          payment,
          createdAt: new Date(),
        });
      } else if (isToday(dueDate)) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: "due_today",
          title: "Payment Due Today",
          message: `${payment.subscription.name} payment of ${amount} is due today`,
          payment,
          createdAt: new Date(),
        });
      } else if (isTomorrow(dueDate)) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: "due_tomorrow",
          title: "Payment Due Tomorrow",
          message: `${payment.subscription.name} payment of ${amount} is due tomorrow`,
          payment,
          createdAt: new Date(),
        });
      } else if (isAfter(dueDate, now) && isBefore(dueDate, nextWeek)) {
        newNotifications.push({
          id: crypto.randomUUID(),
          type: "due_soon",
          title: "Payment Due Soon",
          message: `${payment.subscription.name} payment of ${amount} is due ${format(dueDate, "MMM dd")}`,
          payment,
          createdAt: new Date(),
        });
      }
    });

    // Replace all payment notifications with new ones
    setNotifications((prev) => [
      ...newNotifications,
      ...prev.filter(
        (n) =>
          !["overdue", "due_today", "due_tomorrow", "due_soon"].includes(
            n.type,
          ),
      ),
    ]);
  }, []);

  const hasUnreadNotifications = notifications.length > 0;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        checkPaymentNotifications,
        hasUnreadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
