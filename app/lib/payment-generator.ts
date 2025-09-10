import { prisma } from "./prisma";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
} from "date-fns";

export async function generatePaymentsForSubscription(subscriptionId: string) {
  try {
    const startTime = Date.now();
    
    // Get the subscription with existing payments
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { payments: true },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return [];
    }

    // Clear existing unpaid payments to regenerate them with correct dates
    await prisma.payment.deleteMany({
      where: {
        subscriptionId: subscriptionId,
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
    });

    const paymentsToCreate = [];
    const currentDate = new Date();
    const subscriptionStartDate = new Date(subscription.startDate);

    // Start from the subscription start date
    let nextDueDate = new Date(subscriptionStartDate);

    // Generate payments until subscription end date, or 12 months if no end date
    const generateUntilDate = subscription.endDate
      ? new Date(subscription.endDate)
      : (() => {
          const oneYearFromStart = new Date(subscriptionStartDate);
          oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
          return oneYearFromStart;
        })();

    // If subscription has an end date, don't generate payments beyond it
    const subscriptionEndDate = subscription.endDate
      ? new Date(subscription.endDate)
      : null;

    // Collect all payment data first
    while (
      isBefore(nextDueDate, generateUntilDate) &&
      (!subscriptionEndDate || isBefore(nextDueDate, subscriptionEndDate))
    ) {
      paymentsToCreate.push({
        subscriptionId: subscription.id,
        amount: subscription.amount,
        dueDate: new Date(nextDueDate),
        status: (isAfter(nextDueDate, currentDate) ? "PENDING" : "OVERDUE") as "PENDING" | "OVERDUE",
      });

      // Calculate next due date based on frequency
      nextDueDate = getNextDueDate(nextDueDate, subscription.frequency);

      // Safety break for one-time payments
      if (subscription.frequency === "ONE_TIME") {
        break;
      }
    }

    // Create all payments in a single batch operation
    if (paymentsToCreate.length > 0) {
      await prisma.payment.createMany({
        data: paymentsToCreate,
      });
    }

    const endTime = Date.now();
    console.log(`Generated ${paymentsToCreate.length} payments in ${endTime - startTime}ms`);

    return paymentsToCreate;
  } catch (error) {
    console.error("Error generating payments for subscription:", error);
    return [];
  }
}

export async function generatePaymentsForAllActiveSubscriptions(
  userId: string,
) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
        status: "ACTIVE",
      },
    });

    let totalGenerated = 0;

    for (const subscription of subscriptions) {
      const payments = await generatePaymentsForSubscription(subscription.id);
      totalGenerated += payments.length;
    }

    return totalGenerated;
  } catch (error) {
    console.error("Error generating payments for all subscriptions:", error);
    return 0;
  }
}

function getNextDueDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case "WEEKLY":
      return addWeeks(currentDate, 1);
    case "MONTHLY":
      return addMonths(currentDate, 1);
    case "QUARTERLY":
      return addMonths(currentDate, 3);
    case "YEARLY":
      return addYears(currentDate, 1);
    case "ONE_TIME":
      // For one-time payments, return a date far in the future to stop generation
      return addYears(currentDate, 10);
    default:
      return addMonths(currentDate, 1);
  }
}
