import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: id,
        subscription: {
          userId: session.user.id,
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = await prisma.payment.update({
      where: { id: id },
      data: {
        status: "PAID",
        paidDate: new Date(),
      },
      include: {
        subscription: true,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
