import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../lib/auth"
import { prisma } from "../../lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          where: {
            status: { not: "EXPIRED" }
          },
          orderBy: { amount: "desc" }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      )
    }

    // Calculate totals
    const activeSubscriptions = user.subscriptions.filter(sub => sub.status === "ACTIVE")
    
    const monthlyTotal = activeSubscriptions.reduce((total, sub) => {
      let monthlyAmount = Number(sub.amount)
      
      switch (sub.frequency) {
        case "YEARLY":
          monthlyAmount = monthlyAmount / 12
          break
        case "QUARTERLY":
          monthlyAmount = monthlyAmount / 3
          break
        case "WEEKLY":
          monthlyAmount = monthlyAmount * 4.33 // Average weeks per month
          break
        case "ONE_TIME":
          monthlyAmount = 0 // Don't include one-time payments in monthly total
          break
        // MONTHLY is already correct
      }
      
      return total + monthlyAmount
    }, 0)

    const yearlyTotal = monthlyTotal * 12

    // Calculate total by type
    const totalByType = activeSubscriptions.reduce((acc, sub) => {
      let monthlyAmount = Number(sub.amount)
      
      switch (sub.frequency) {
        case "YEARLY":
          monthlyAmount = monthlyAmount / 12
          break
        case "QUARTERLY":
          monthlyAmount = monthlyAmount / 3
          break
        case "WEEKLY":
          monthlyAmount = monthlyAmount * 4.33
          break
        case "ONE_TIME":
          monthlyAmount = 0
          break
      }
      
      acc[sub.type] = (acc[sub.type] || 0) + monthlyAmount
      return acc
    }, {} as Record<string, number>)

    // Convert Decimal amounts to numbers for proper JSON serialization
    const serializedSubscriptions = user.subscriptions.map(sub => ({
      ...sub,
      amount: Number(sub.amount)
    }))

    const dashboardData = {
      subscriptions: serializedSubscriptions,
      monthlyTotal,
      yearlyTotal,
      totalByType
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Errore nel recupero dei dati dashboard:", error)
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    )
  }
}