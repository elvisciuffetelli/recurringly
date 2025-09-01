import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../lib/auth"
import { prisma } from "../../lib/prisma"
import { z } from "zod"

const createPaymentSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime(),
  paidDate: z.string().datetime().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).default("PENDING"),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const subscriptionId = url.searchParams.get("subscriptionId")

    const whereClause: any = {
      subscription: {
        userId: session.user.id,
      },
    }

    if (subscriptionId) {
      whereClause.subscriptionId = subscriptionId
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        subscription: true,
      },
      orderBy: { dueDate: "asc" },
    })

    // Convert Decimal amounts to numbers for proper JSON serialization
    const serializedPayments = payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      subscription: {
        ...payment.subscription,
        amount: Number(payment.subscription.amount)
      }
    }))

    return NextResponse.json(serializedPayments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: validatedData.subscriptionId,
        userId: session.user.id,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        dueDate: new Date(validatedData.dueDate),
        paidDate: validatedData.paidDate ? new Date(validatedData.paidDate) : null,
      },
      include: {
        subscription: true,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}