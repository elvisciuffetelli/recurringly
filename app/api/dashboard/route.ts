import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: { not: "EXPIRED" },
          },
          orderBy: { amount: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 },
      );
    }

    // Calculate totals
    const activeSubscriptions = user.subscriptions.filter(
      (sub) => sub.status === "ACTIVE",
    );

    const currentDate = new Date();
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(currentDate.getFullYear() + 1);

    // Calculate monthly total (average recurring monthly cost over next 12 months, excluding ONE_TIME)
    const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
      // Skip subscription if it has already ended
      if (sub.endDate && new Date(sub.endDate) < currentDate) {
        return total;
      }

      // Skip ONE_TIME payments from monthly recurring total
      if (sub.frequency === "ONE_TIME") {
        return total;
      }

      let monthlyAmount = Number(sub.amount);

      switch (sub.frequency) {
        case "YEARLY":
          monthlyAmount = monthlyAmount / 12;
          break;
        case "QUARTERLY":
          monthlyAmount = monthlyAmount / 3;
          break;
        case "WEEKLY":
          monthlyAmount = monthlyAmount * 4.33; // Average weeks per month
          break;
        // MONTHLY is already correct
      }

      // If subscription has an end date within next 12 months, 
      // calculate the average monthly cost over the full 12 months
      if (sub.endDate) {
        const endDate = new Date(sub.endDate);
        if (endDate <= nextYear) {
          // Calculate how many months this subscription will be active
          const monthsDiff = (endDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - currentDate.getMonth()) + 1; // +1 to include current month
          const monthsActive = Math.max(0, Math.min(monthsDiff, 12));
          
          // Average the cost over 12 months
          monthlyAmount = (monthlyAmount * monthsActive) / 12;
        }
      }

      return total + monthlyAmount;
    }, 0);

    // Calculate yearly total (actual cost for next 12 months, including ONE_TIME)
    const yearlyTotal = activeSubscriptions.reduce((total, sub) => {
      // Skip subscription if it has already ended
      if (sub.endDate && new Date(sub.endDate) < currentDate) {
        return total;
      }

      if (sub.frequency === "ONE_TIME") {
        // For one-time payments, include full amount if it's due within next 12 months
        if (sub.endDate) {
          const endDate = new Date(sub.endDate);
          if (endDate <= nextYear) {
            return total + Number(sub.amount);
          }
        }
        return total;
      }

      // For recurring subscriptions, calculate monthly equivalent
      let monthlyAmount = Number(sub.amount);
      switch (sub.frequency) {
        case "YEARLY":
          monthlyAmount = monthlyAmount / 12;
          break;
        case "QUARTERLY":
          monthlyAmount = monthlyAmount / 3;
          break;
        case "WEEKLY":
          monthlyAmount = monthlyAmount * 4.33;
          break;
        // MONTHLY is already correct
      }

      // Calculate how many months this subscription will be active in the next 12 months
      let monthsActive = 12;
      
      if (sub.endDate) {
        const endDate = new Date(sub.endDate);
        if (endDate <= nextYear) {
          // Calculate months between now and end date
          const monthsDiff = (endDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                           (endDate.getMonth() - currentDate.getMonth()) + 1; // +1 to include current month
          monthsActive = Math.max(0, Math.min(monthsDiff, 12));
        }
      }

      return total + (monthlyAmount * monthsActive);
    }, 0);

    // Calculate total by type
    const totalByType = activeSubscriptions.reduce(
      (acc, sub) => {
        let monthlyAmount = Number(sub.amount);

        switch (sub.frequency) {
          case "YEARLY":
            monthlyAmount = monthlyAmount / 12;
            break;
          case "QUARTERLY":
            monthlyAmount = monthlyAmount / 3;
            break;
          case "WEEKLY":
            monthlyAmount = monthlyAmount * 4.33;
            break;
          case "ONE_TIME":
            monthlyAmount = 0;
            break;
        }

        acc[sub.type] = (acc[sub.type] || 0) + monthlyAmount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Convert Decimal amounts to numbers for proper JSON serialization
    const serializedSubscriptions = user.subscriptions.map((sub) => ({
      ...sub,
      amount: Number(sub.amount),
    }));

    const dashboardData = {
      subscriptions: serializedSubscriptions,
      monthlyTotal,
      yearlyTotal,
      totalByType,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Errore nel recupero dei dati dashboard:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 },
    );
  }
}
