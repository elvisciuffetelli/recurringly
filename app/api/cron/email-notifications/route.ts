import { addDays, isAfter, isBefore, isToday, isTomorrow } from "date-fns";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { emailService } from "../../../lib/email-service";
import { prisma } from "../../../lib/prisma";

// This endpoint will be called by cron job to send all email notifications
export async function GET(_request: NextRequest) {
  try {
    console.log("🔄 Starting email notification cron job...");

    // Get all users with their pending/overdue payments
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          include: {
            payments: {
              where: {
                status: { in: ["PENDING", "OVERDUE"] },
              },
            },
          },
        },
      },
    });

    const emailResults = {
      totalUsers: users.length,
      emailsSent: 0,
      emailsFailed: 0,
      usersProcessed: 0,
      notificationTypes: {
        due_today: 0,
        due_tomorrow: 0,
        due_soon: 0,
        overdue: 0,
      },
      details: [] as Array<{
        userId: string;
        userEmail: string;
        paymentId: string;
        subscriptionName: string;
        amount?: number;
        currency?: string;
        dueDate?: Date;
        notificationType: string;
        status: string;
        error?: string;
      }>,
    };

    const now = new Date();
    const nextWeek = addDays(now, 7);

    for (const user of users) {
      if (!user.email) {
        console.log(`⚠️ User ${user.id} has no email address, skipping...`);
        continue;
      }

      // Get all payments that need notifications
      const paymentsNeedingNotification = user.subscriptions.flatMap((subscription) =>
        subscription.payments
          .map((payment) => {
            const dueDate = new Date(payment.dueDate);
            let notificationType:
              | "due_today"
              | "due_tomorrow"
              | "due_soon"
              | "overdue"
              | null = null;

            // Determine notification type based on payment status and due date
            if (payment.status === "OVERDUE") {
              notificationType = "overdue";
            } else if (isToday(dueDate)) {
              notificationType = "due_today";
            } else if (isTomorrow(dueDate)) {
              notificationType = "due_tomorrow";
            } else if (isAfter(dueDate, now) && isBefore(dueDate, nextWeek)) {
              notificationType = "due_soon";
            }

            return notificationType
              ? {
                  ...payment,
                  subscription,
                  notificationType,
                }
              : null;
          })
          .filter(Boolean),
      );

      if (paymentsNeedingNotification.length === 0) {
        continue; // No payments needing notifications for this user
      }

      emailResults.usersProcessed++;

      // Send email notification for each payment
      for (const payment of paymentsNeedingNotification) {
        if (!payment) continue;

        try {
          const emailSent = await emailService.sendPaymentNotification({
            userEmail: user.email,
            userName: user.name || undefined,
            payment: {
              id: payment.id,
              amount: Number(payment.amount),
              dueDate: payment.dueDate.toISOString(),
              status: payment.status as "PENDING" | "PAID" | "OVERDUE",
              subscription: {
                name: payment.subscription.name,
                currency: payment.subscription.currency,
                type: payment.subscription.type,
              },
            },
            notificationType: payment.notificationType,
          });

          if (emailSent) {
            emailResults.emailsSent++;
            emailResults.notificationTypes[payment.notificationType]++;
            emailResults.details.push({
              userId: user.id,
              userEmail: user.email,
              paymentId: payment.id,
              subscriptionName: payment.subscription.name,
              amount: Number(payment.amount),
              currency: payment.subscription.currency,
              dueDate: payment.dueDate,
              notificationType: payment.notificationType,
              status: "sent",
            });

            console.log(
              `✅ Email sent to ${user.email} for ${payment.subscription.name} (${payment.notificationType})`,
            );
          } else {
            emailResults.emailsFailed++;
            emailResults.details.push({
              userId: user.id,
              userEmail: user.email,
              paymentId: payment.id,
              subscriptionName: payment.subscription.name,
              notificationType: payment.notificationType,
              status: "failed",
            });

            console.log(
              `❌ Failed to send email to ${user.email} for ${payment.subscription.name} (${payment.notificationType})`,
            );
          }
        } catch (error) {
          emailResults.emailsFailed++;
          emailResults.details.push({
            userId: user.id,
            userEmail: user.email,
            paymentId: payment.id,
            subscriptionName: payment.subscription.name,
            notificationType: payment.notificationType,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });

          console.error(`💥 Error sending email to ${user.email}:`, error);
        }
      }
    }

    const summary = `📧 Email notification job completed:
- Users checked: ${emailResults.totalUsers}
- Users with notifications sent: ${emailResults.usersProcessed}
- Total emails sent: ${emailResults.emailsSent}
- Emails failed: ${emailResults.emailsFailed}
- Breakdown by type:
  • Due today: ${emailResults.notificationTypes.due_today}
  • Due tomorrow: ${emailResults.notificationTypes.due_tomorrow}
  • Due soon: ${emailResults.notificationTypes.due_soon}
  • Overdue: ${emailResults.notificationTypes.overdue}`;

    console.log(summary);

    return NextResponse.json({
      success: true,
      message: "Email notification cron job completed successfully",
      timestamp: new Date().toISOString(),
      summary: emailResults,
    });
  } catch (error) {
    console.error("💥 Error in email notification cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process email notifications",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}