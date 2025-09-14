import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentDate = new Date()

    // Find all pending payments that are now overdue
    const overduePayments = await prisma.payment.updateMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: currentDate
        },
        subscription: {
          userId: session.user.id
        }
      },
      data: {
        status: "OVERDUE"
      }
    })

    return NextResponse.json({
      message: `Updated ${overduePayments.count} payments to overdue status`,
      updatedCount: overduePayments.count
    })
  } catch (error) {
    console.error("Error updating overdue payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// This endpoint can also be called without authentication for cron jobs
export async function GET() {
  try {
    const currentDate = new Date()

    // Find all pending payments that are now overdue
    const overduePayments = await prisma.payment.updateMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: currentDate
        }
      },
      data: {
        status: "OVERDUE"
      }
    })

    return NextResponse.json({
      message: `Updated ${overduePayments.count} payments to overdue status`,
      updatedCount: overduePayments.count
    })
  } catch (error) {
    console.error("Error updating overdue payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}