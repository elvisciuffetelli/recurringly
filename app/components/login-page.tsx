"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Recurringly</CardTitle>
          <CardDescription>
            Manage your recurring expenses and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full"
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? "Signing in with Google..." : "Sign In with Google"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => signIn()}
            className="w-full"
          >
            Sign In with Email
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Sign in to start managing your subscriptions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
