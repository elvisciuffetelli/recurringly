"use client"

import { signIn } from "next-auth/react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">MySubscriptions</CardTitle>
          <CardDescription>
            Manage your recurring expenses and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => signIn()}
            className="w-full"
          >
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to start managing your subscriptions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}