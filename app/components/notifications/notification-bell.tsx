"use client";

import { useState } from "react";
import { Bell, X, AlertCircle, Clock, Calendar, Mail, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { useNotifications } from "../providers/notification-provider";
import { format } from "date-fns";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const {
    notifications,
    removeNotification,
    clearAllNotifications,
    hasUnreadNotifications,
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "due_today":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "due_tomorrow":
      case "due_soon":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "overdue":
        return "border-l-red-500 bg-red-50";
      case "due_today":
        return "border-l-orange-500 bg-orange-50";
      case "due_tomorrow":
        return "border-l-blue-500 bg-blue-50";
      case "due_soon":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const sendEmailNotifications = async () => {
    try {
      setSendingEmails(true);

      const response = await fetch("/api/notifications/email", {
        method: "GET",
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Email notifications sent! ${result.emailsSent} emails sent successfully.`,
        );
      } else {
        const error = await response.json();
        alert(`Failed to send email notifications: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending email notifications:", error);
      alert("An error occurred while sending email notifications.");
    } finally {
      setSendingEmails(false);
    }
  };

  const testDailyReminders = async () => {
    try {
      setSendingEmails(true);

      const response = await fetch("/api/cron/daily-email-reminders", {
        method: "GET",
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Daily reminder test completed! ${result.summary?.emailsSent || 0} emails sent.`,
        );
      } else {
        const error = await response.json();
        alert(`Daily reminder test failed: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error testing daily reminders:", error);
      alert("An error occurred while testing daily reminders.");
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notifications.length > 99 ? "99+" : notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Payment Notifications</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={sendEmailNotifications}
                disabled={sendingEmails}
                className="text-xs flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                {sendingEmails ? "Sending..." : "Email All"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testDailyReminders}
                disabled={sendingEmails}
                className="text-xs flex items-center gap-1"
                title="Test automatic daily reminders (payments due tomorrow)"
              >
                <Zap className="h-3 w-3" />
                Test Auto
              </Button>
            </div>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No new notifications
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 p-3 mb-2 rounded-r-md ${getNotificationColor(notification.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(notification.createdAt, "MMM dd, h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNotification(notification.id)}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
