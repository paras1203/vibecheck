"use client";

import { useState, useEffect, Suspense, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { HeroHighlight } from "@/components/ui/hero-highlight";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

function safeInternalNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginInner() {
  const {
    user,
    handleGoogleAuth,
    handleEmailSignIn,
    handleEmailSignUp,
    sendPasswordResetToEmail,
    sendEmailSignInLink,
    completeEmailLinkSignInIfPresent,
    loading,
    isSyncing,
    authResolved,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalNext(searchParams.get("next"));
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<"signin" | "signup">(
    modeParam === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (user && !loading && authResolved && !isSyncing) {
      router.replace(nextPath);
    }
  }, [user, loading, authResolved, isSyncing, router, nextPath]);

  useEffect(() => {
    if (modeParam === "signup" || modeParam === "signin") {
      setMode(modeParam === "signup" ? "signup" : "signin");
    }
  }, [modeParam]);

  useEffect(() => {
    if (typeof window === "undefined" || loading) return;
    let cancelled = false;
    (async () => {
      try {
        await completeEmailLinkSignInIfPresent(window.location.href);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Email link sign-in failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, completeEmailLinkSignInIfPresent]);

  const busy = loading || isSyncing;

  const onGoogle = async () => {
    startTransition(() => setError(null));
    try {
      await handleGoogleAuth();
    } catch (e) {
      startTransition(() =>
        setError(e instanceof Error ? e.message : "Google sign-in failed")
      );
    }
  };

  const onEmail = async () => {
    startTransition(() => setError(null));
    if (!email.trim() || !password) {
      startTransition(() => setError("Enter email and password."));
      return;
    }
    try {
      if (mode === "signup") {
        await handleEmailSignUp(email, password);
      } else {
        await handleEmailSignIn(email, password);
      }
    } catch (e) {
      startTransition(() =>
        setError(e instanceof Error ? e.message : "Email authentication failed")
      );
    }
  };

  const onEmailLink = async () => {
    startTransition(() => {
      setError(null);
      setLinkSent(false);
    });
    if (!email.trim()) {
      startTransition(() => setError("Enter your email to receive a sign-in link."));
      return;
    }
    setLinkBusy(true);
    try {
      await sendEmailSignInLink(email, nextPath);
      startTransition(() => setLinkSent(true));
    } catch (e) {
      startTransition(() =>
        setError(e instanceof Error ? e.message : "Could not send sign-in link")
      );
    } finally {
      setLinkBusy(false);
    }
  };

  const onForgotPassword = async () => {
    startTransition(() => {
      setError(null);
      setResetMessage(null);
    });
    const target = email.trim();
    if (!target) {
      startTransition(() => setError("Enter your email above, then tap forgot password."));
      return;
    }
    setResetBusy(true);
    try {
      await sendPasswordResetToEmail(target);
      startTransition(() =>
        setResetMessage("If an account exists for that email, we sent a reset link.")
      );
    } catch (e) {
      startTransition(() =>
        setError(e instanceof Error ? e.message : "Could not send reset email")
      );
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroHighlight containerClassName="!h-auto min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-20 md:px-8">
          <div className="relative w-full max-w-md space-y-6 rounded-xl border border-border bg-card/80 p-8 pt-12 shadow-sm backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href="/" aria-label="Close">
                <X className="size-5" />
              </Link>
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {mode === "signup" ? "Welcome" : "Welcome back"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{BRAND_NAME}</p>
            </div>

            <Button
              type="button"
              className="h-12 w-full gap-2 text-base font-semibold"
              onClick={onGoogle}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setMode("signin")}
              >
                Log in
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setMode("signup")}
              >
                Sign up
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </div>
              <Button
                type="button"
                className="h-11 w-full"
                onClick={onEmail}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "signup" ? (
                  "Create account"
                ) : (
                  "Log in with email"
                )}
              </Button>
              {mode === "signin" && (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto w-full p-0 text-xs text-muted-foreground"
                    onClick={onForgotPassword}
                    disabled={resetBusy}
                  >
                    {resetBusy ? (
                      <Loader2 className="inline size-3 animate-spin" />
                    ) : (
                      "Forgot password? (uses email above)"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full text-sm"
                    onClick={onEmailLink}
                    disabled={busy || linkBusy}
                  >
                    {linkBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Email me a sign-in link"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            {linkSent && (
              <p className="text-center text-sm text-muted-foreground">
                Check your inbox for the sign-in link. Open it on this device if you started here, or
                enter the same email when prompted on another device.
              </p>
            )}
            {resetMessage && (
              <p className="text-center text-sm text-muted-foreground">{resetMessage}</p>
            )}
          </div>
        </div>
      </HeroHighlight>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
