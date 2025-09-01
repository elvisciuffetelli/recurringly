import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import NotificationProvider from "./components/providers/notification-provider";
import AuthProvider from "./components/providers/session-provider";
import "./lib/app-initializer"; // Initialize cron jobs

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recurringly",
  description: "Personal recurring expenses management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotificationProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
