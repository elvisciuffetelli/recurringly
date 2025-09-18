"use client";

import { getSession, signIn } from "next-auth/react";
import { useQueryState } from "nuqs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();
  const [urlError] = useQueryState("error");

  // Handle URL errors with nuqs
  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return "";

    switch (errorCode) {
      case "OAuthAccountNotLinked":
        return "Un account con questa email esiste già. Prova ad accedere con email e password, oppure usa un'altra email Google.";
      case "OAuthSignin":
        return "Errore durante l'accesso con Google. Riprova.";
      case "OAuthCallback":
        return "Errore di callback OAuth. Verifica la configurazione.";
      case "OAuthCreateAccount":
        return "Impossibile creare l'account. Riprova o contatta il supporto.";
      case "EmailCreateAccount":
        return "Impossibile creare l'account con questa email.";
      case "Callback":
        return "Errore di callback durante l'autenticazione.";
      case "Default":
        return "Si è verificato un errore durante l'accesso. Riprova.";
      default:
        return "Si è verificato un errore sconosciuto. Riprova.";
    }
  };

  const displayError = error || getErrorMessage(urlError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o password non validi");
      } else {
        // Check if sign in was successful
        const session = await getSession();
        if (session) {
          router.push("/");
          router.refresh();
        }
      }
    } catch (error) {
      setError("Si è verificato un errore. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: false
      });

      if (result?.error) {
        setError("Errore durante l'accesso con Google. Riprova.");
      } else if (result?.url) {
        // Redirect manually if successful
        window.location.href = result.url;
      }
    } catch (error) {
      setError("Si è verificato un errore durante l'accesso con Google.");
      console.error("Google sign-in error:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Bentornato</CardTitle>
          <CardDescription>Accedi al tuo account Recurringly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tua@email.it"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="La tua password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            {displayError && (
              <div className="text-sm text-red-600 text-center">{displayError}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Oppure continua con
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            type="button"
          >
            {isGoogleLoading ? "Accesso con Google in corso..." : "Accedi con Google"}
          </Button>

          <div className="text-center text-sm">
            Non hai un account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:underline cursor-pointer"
            >
              Registrati
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Bentornato</CardTitle>
            <CardDescription>Caricamento...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
