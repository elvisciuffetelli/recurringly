import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"
import { z } from "zod"

const updatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  dueDate: z.string().datetime().optional(),
  paidDate: z.string().datetime().nullable().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
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

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: id,
        subscription: {
          userId: session.user.id,
        },
      },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    const updateData: any = { ...validatedData }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate)
    }
    if (validatedData.paidDate !== undefined) {
      updateData.paidDate = validatedData.paidDate ? new Date(validatedData.paidDate) : null
    }

    const payment = await prisma.payment.update({
      where: { id: id },
      data: updateData,
      include: {
        subscription: true,
      },
    })

    return NextResponse.json(payment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: id,
        subscription: {
          userId: session.user.id,
        },
      },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    await prisma.payment.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}