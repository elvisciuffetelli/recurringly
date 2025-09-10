import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { generatePaymentsForSubscription } from "../../lib/payment-generator";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["SUBSCRIPTION", "TAX", "INSTALLMENT", "OTHER"]),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("EUR"),
  frequency: z.enum(["MONTHLY", "YEARLY", "WEEKLY", "QUARTERLY", "ONE_TIME"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "EXPIRED"]).default("ACTIVE"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      include: {
        payments: true,
      },
      orderBy: { amount: "desc" },
    });

    // Convert Decimal amounts to numbers for proper JSON serialization
    const serializedSubscriptions = subscriptions.map((sub) => ({
      ...sub,
      amount: Number(sub.amount),
      payments: sub.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    }));

    return NextResponse.json(serializedSubscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSubscriptionSchema.parse(body);

    const subscription = await prisma.subscription.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        userId: session.user.id,
      },
    });

    // Automatically generate payments for the new subscription
    await generatePaymentsForSubscription(subscription.id);

    // Revalidate the home page to refresh all data including payments
    revalidatePath("/");

    // Return the subscription (payments will be fetched via other endpoints)
    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
