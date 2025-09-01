"use client";

import { signOut } from "next-auth/react";
import type { ReactNode } from "react";
import NotificationBell from "./notifications/notification-bell";
import { Button } from "./ui/button";

interface AuthenticatedLayoutProps {
  session: any;
  children: ReactNode;
}

export default function AuthenticatedLayout({
  session,
  children,
}: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Recurringly</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <NotificationBell />
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
