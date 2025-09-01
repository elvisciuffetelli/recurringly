import { prisma } from "./prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"
import { getYear } from "date-fns"

export async function getSubscriptions() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Convert Decimal objects to plain numbers for client components
  return subscriptions.map(sub => ({
    ...sub,
    amount: Number(sub.amount)
  }))
}

interface PaymentFilters {
  status?: "all" | "pending" | "paid" | "overdue"
  year?: number | "all" | "current"
  page?: number
}

export async function getPayments(filters: PaymentFilters = {}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Build where clause based on filters
  const whereClause: any = {
    subscription: {
      userId: session.user.id,
    },
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    whereClause.status = filters.status.toUpperCase()
  }

  // Year filter
  if (filters.year && filters.year !== "all") {
    let yearToFilter: number
    
    if (filters.year === "current") {
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      
      whereClause.dueDate = {
        gte: new Date(`${currentYear}-01-01`),
        lt: new Date(`${nextYear + 1}-01-01`)
      }
    } else {
      yearToFilter = filters.year as number
      whereClause.dueDate = {
        gte: new Date(`${yearToFilter}-01-01`),
        lt: new Date(`${yearToFilter + 1}-01-01`)
      }
    }
  }

  const payments = await prisma.payment.findMany({
    where: whereClause,
    include: {
      subscription: true,
    },
    orderBy: { dueDate: "asc" },
  })

  // Convert Decimal objects to plain numbers for client components
  return payments.map(payment => ({
    ...payment,
    amount: Number(payment.amount),
    subscription: {
      ...payment.subscription,
      amount: Number(payment.subscription.amount)
    }
  }))
}

export async function getDashboardData() {
  const subscriptions = await getSubscriptions()
  
  // Calculate totals
  const monthlyTotal = calculateMonthlyTotal(subscriptions)
  const yearlyTotal = calculateYearlyTotal(subscriptions)
  const totalByType = calculateTotalByType(subscriptions)
  
  return {
    subscriptions,
    monthlyTotal,
    yearlyTotal,
    totalByType,
  }
}

// Helper functions for calculations
function calculateMonthlyTotal(subscriptions: any[]) {
  return subscriptions
    .filter(sub => sub.status === "ACTIVE")
    .reduce((total, sub) => {
      const amount = Number(sub.amount)
      if (isNaN(amount)) return total
      
      switch (sub.frequency) {
        case "MONTHLY":
          return total + amount
        case "YEARLY":
          return total + (amount / 12)
        case "WEEKLY":
          return total + (amount * 4.33) // Average weeks per month
        case "QUARTERLY":
          return total + (amount / 3)
        case "ONE_TIME":
          return total // One-time payments don't count towards monthly recurring
        default:
          return total
      }
    }, 0)
}

function calculateYearlyTotal(subscriptions: any[]) {
  return subscriptions
    .filter(sub => sub.status === "ACTIVE")
    .reduce((total, sub) => {
      const amount = Number(sub.amount)
      if (isNaN(amount)) return total
      
      switch (sub.frequency) {
        case "MONTHLY":
          return total + (amount * 12)
        case "YEARLY":
          return total + amount
        case "WEEKLY":
          return total + (amount * 52)
        case "QUARTERLY":
          return total + (amount * 4)
        case "ONE_TIME":
          return total + amount
        default:
          return total
      }
    }, 0)
}

function calculateTotalByType(subscriptions: any[]) {
  const totals: Record<string, number> = {}
  
  subscriptions
    .filter(sub => sub.status === "ACTIVE")
    .forEach(sub => {
      const monthlyAmount = calculateMonthlyAmount(sub)
      totals[sub.type] = (totals[sub.type] || 0) + monthlyAmount
    })
  
  return totals
}

function calculateMonthlyAmount(subscription: any) {
  const amount = Number(subscription.amount)
  if (isNaN(amount)) return 0
  
  switch (subscription.frequency) {
    case "MONTHLY":
      return amount
    case "YEARLY":
      return amount / 12
    case "WEEKLY":
      return amount * 4.33
    case "QUARTERLY":
      return amount / 3
    case "ONE_TIME":
      return 0 // Don't count one-time in recurring totals
    default:
      return 0
  }
}