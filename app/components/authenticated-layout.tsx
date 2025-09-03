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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Recurringly
            </h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:block text-sm text-gray-700">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
