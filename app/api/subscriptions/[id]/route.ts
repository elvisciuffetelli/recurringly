import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { generatePaymentsForSubscription } from "../../../lib/payment-generator";
import { z } from "zod";

const updateSubscriptionSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(["SUBSCRIPTION", "TAX", "INSTALLMENT", "OTHER"]).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  currency: z.string().optional(),
  frequency: z
    .enum(["MONTHLY", "YEARLY", "WEEKLY", "QUARTERLY", "ONE_TIME"])
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "EXPIRED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        payments: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateSubscriptionSchema.parse(body);

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    const subscription = await prisma.subscription.update({
      where: { id: id },
      data: updateData,
      include: {
        payments: true,
      },
    });

    // If the subscription is still active, regenerate payments
    if (subscription.status === "ACTIVE") {
      await generatePaymentsForSubscription(subscription.id);

      // Fetch updated subscription with new payments
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: id },
        include: { payments: true },
      });

      return NextResponse.json(updatedSubscription);
    }

    return NextResponse.json(subscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error updating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    await prisma.subscription.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
