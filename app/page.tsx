import { getServerSession } from "next-auth/next"
import { authOptions } from "./lib/auth"
import { getPayments } from "./lib/data-fetchers"
import { Suspense } from "react"
import AuthenticatedLayout from "./components/authenticated-layout"
import Dashboard from "./components/dashboard"
import LoginPage from "./components/login-page"

interface HomeProps {
  searchParams: Promise<{
    status?: string
    year?: string
    page?: string
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <LoginPage />
  }

  // Await and parse search parameters
  const params = await searchParams
  
  // Parse and validate parameters
  let parsedYear: number | "all" | "current" = "current"
  if (params.year) {
    if (params.year === "all" || params.year === "current") {
      parsedYear = params.year
    } else {
      const yearNum = parseInt(params.year, 10)
      if (!isNaN(yearNum)) {
        parsedYear = yearNum
      }
    }
  }

  const filters = {
    status: params.status as "all" | "pending" | "paid" | "overdue" | undefined,
    year: parsedYear,
    page: params.page ? parseInt(params.page, 10) : 1,
  }

  // Fetch only payments data since dashboard data is now handled by SWR
  const payments = await getPayments(filters)

  return (
    <AuthenticatedLayout session={session}>
      <Suspense fallback={<div>Caricamento dashboard...</div>}>
        <Dashboard 
          payments={payments}
          initialFilters={filters}
        />
      </Suspense>
    </AuthenticatedLayout>
  )
}
