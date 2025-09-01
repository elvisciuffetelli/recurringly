import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"
import { emailService } from "../../../lib/email-service"
import { isToday, isTomorrow, isAfter, isBefore, addDays } from "date-fns"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { paymentId, notificationType } = body

    if (!paymentId || !notificationType) {
      return NextResponse.json({ 
        error: "Missing required fields: paymentId, notificationType" 
      }, { status: 400 })
    }

    // Get the payment with subscription details
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        subscription: {
          userId: session.user.id,
        },
      },
      include: {
        subscription: true,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // Send email notification
    const emailSent = await emailService.sendPaymentNotification({
      userEmail: session.user.email,
      userName: session.user.name || undefined,
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
      notificationType: notificationType as 'due_today' | 'due_tomorrow' | 'due_soon' | 'overdue',
    })

    if (emailSent) {
      return NextResponse.json({ 
        message: "Email notification sent successfully",
        paymentId,
        notificationType 
      })
    } else {
      return NextResponse.json(
        { error: "Failed to send email notification" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error sending email notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Endpoint to send notifications for all due payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all pending payments for the user
    const payments = await prisma.payment.findMany({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
        subscription: {
          userId: session.user.id,
        },
      },
      include: {
        subscription: true,
      },
      orderBy: { dueDate: "asc" },
    })

    const now = new Date()
    const nextWeek = addDays(now, 7)
    const emailsSent: any[] = []
    const emailsFailed: any[] = []

    for (const payment of payments) {
      const dueDate = new Date(payment.dueDate)
      let notificationType: 'due_today' | 'due_tomorrow' | 'due_soon' | 'overdue' | null = null

      if (payment.status === "OVERDUE") {
        notificationType = "overdue"
      } else if (isToday(dueDate)) {
        notificationType = "due_today"
      } else if (isTomorrow(dueDate)) {
        notificationType = "due_tomorrow"
      } else if (isAfter(dueDate, now) && isBefore(dueDate, nextWeek)) {
        notificationType = "due_soon"
      }

      if (notificationType) {
        try {
          const emailSent = await emailService.sendPaymentNotification({
            userEmail: session.user.email!,
            userName: session.user.name || undefined,
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
            notificationType,
          })

          if (emailSent) {
            emailsSent.push({
              paymentId: payment.id,
              subscriptionName: payment.subscription.name,
              notificationType,
            })
          } else {
            emailsFailed.push({
              paymentId: payment.id,
              subscriptionName: payment.subscription.name,
              notificationType,
            })
          }
        } catch (error) {
          console.error(`Failed to send email for payment ${payment.id}:`, error)
          emailsFailed.push({
            paymentId: payment.id,
            subscriptionName: payment.subscription.name,
            notificationType,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      message: "Email notification batch completed",
      totalProcessed: payments.length,
      emailsSent: emailsSent.length,
      emailsFailed: emailsFailed.length,
      details: {
        sent: emailsSent,
        failed: emailsFailed,
      },
    })
  } catch (error) {
    console.error("Error in email notification batch:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}