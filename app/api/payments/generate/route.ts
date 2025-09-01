import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"
import { addDays, addWeeks, addMonths, addYears, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active subscriptions for the user
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId: session.user.id,
        status: "ACTIVE"
      },
      include: {
        payments: true
      }
    })

    let generatedCount = 0
    const currentDate = new Date()
    
    // Generate payments for the next 12 months for each subscription
    for (const subscription of subscriptions) {
      const payments = await generatePaymentsForSubscription(subscription, currentDate)
      generatedCount += payments.length
    }

    return NextResponse.json({ 
      message: `Generated ${generatedCount} payments`,
      generatedCount 
    })
  } catch (error) {
    console.error("Error generating payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function generatePaymentsForSubscription(subscription: any, currentDate: Date) {
  const generatedPayments = []
  // Generate payments until subscription end date, or 12 months if no end date
  const endDate = subscription.endDate ? new Date(subscription.endDate) : (() => {
    const oneYearFromStart = new Date(subscription.startDate)
    oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1)
    return oneYearFromStart
  })()
  
  // Start from subscription start date
  let nextDueDate = new Date(subscription.startDate)
  
  // If subscription has an end date, don't generate payments beyond it
  const subscriptionEndDate = subscription.endDate ? new Date(subscription.endDate) : null
  
  while (isBefore(nextDueDate, endDate) && (!subscriptionEndDate || isBefore(nextDueDate, subscriptionEndDate))) {
    // Check if payment already exists for this due date
    const existingPayment = await prisma.payment.findFirst({
      where: {
        subscriptionId: subscription.id,
        dueDate: {
          gte: startOfMonth(nextDueDate),
          lt: endOfMonth(nextDueDate)
        }
      }
    })

    if (!existingPayment) {
      // Create the payment
      const payment = await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: subscription.amount,
          dueDate: nextDueDate,
          status: isAfter(nextDueDate, currentDate) ? "PENDING" : "OVERDUE"
        }
      })
      generatedPayments.push(payment)
    }

    // Calculate next due date based on frequency
    nextDueDate = getNextDueDate(nextDueDate, subscription.frequency)
  }

  return generatedPayments
}

function getNextDueDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case "WEEKLY":
      return addWeeks(currentDate, 1)
    case "MONTHLY":
      return addMonths(currentDate, 1)
    case "QUARTERLY":
      return addMonths(currentDate, 3)
    case "YEARLY":
      return addYears(currentDate, 1)
    case "ONE_TIME":
      // For one-time payments, return a date far in the future to stop generation
      return addYears(currentDate, 10)
    default:
      return addMonths(currentDate, 1)
  }
}