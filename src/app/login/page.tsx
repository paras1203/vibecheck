"use client";

import { useState, useEffect, Suspense, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import Link from "next/link";
import { resolvePostLoginPath } from "@/lib/post-login-redirect";
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
    completeEmailLinkSignInIfPresent,
    loading,
    isSyncing,
    authResolved,
    firebaseConfigured,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasExplicitNextQuery = searchParams.has("next");
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

  useEffect(() => {
    if (!user || loading || !authResolved || isSyncing) return;
    const dest = resolvePostLoginPath({
      hasExplicitNextQuery,
      nextPath,
      onboardingCompleted: user.firestoreSynced ? user.onboardingCompleted : false,
    });
    router.replace(dest);
  }, [user, loading, authResolved, isSyncing, router, nextPath, hasExplicitNextQuery]);

  useEffect(() => {
    if (modeParam === "signup" || modeParam === "signin") {
      setMode(modeParam === "signup" ? "signup" : "signin");
    }
  }, [modeParam]);

  useEffect(() => {
    if (typeof window === "undefined" || loading || !firebaseConfigured) return;
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
  }, [loading, firebaseConfigured, completeEmailLinkSignInIfPresent]);

  const busy = loading || isSyncing || !firebaseConfigured;

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
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground">
      <Navbar landingVisualId="a1" showLandingVariationSwitcher={false} navMode="concept" tone="default" />
      <main className="w-full min-w-0 overflow-x-clip">
        <div className="flex min-h-[calc(100vh-1px)] flex-col items-center justify-center gap-8 px-4 py-16 md:px-8 md:py-12">
          <div className="relative w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 pb-10 pt-14 shadow-surface-sm">
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
            <div className="flex min-h-[24rem] flex-col gap-5">
              <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {mode === "signup" ? "Welcome" : "Welcome back"}
              </h1>

            {!firebaseConfigured && authResolved && (
              <p className="rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-center text-xs leading-snug text-destructive">
                Firebase client is not configured. Check deployment env vars and{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">/api/firebase/client-config</code>
                .
              </p>
            )}

            <Button
              type="button"
              className="h-11 w-full gap-2 text-sm font-semibold"
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

            <div className="flex shrink-0 gap-2 pb-1">
              <Button
                type="button"
                variant={mode === "signin" ? "default" : "outline"}
                size="sm"
                className="h-9 flex-1 text-sm"
                onClick={() => setMode("signin")}
              >
                Log in
              </Button>
              <Button
                type="button"
                variant={mode === "signup" ? "default" : "outline"}
                size="sm"
                className="h-9 flex-1 text-sm"
                onClick={() => setMode("signup")}
              >
                Sign up
              </Button>
            </div>

            <div className="min-h-[260px] space-y-3">
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
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-60"
                    onClick={() => void onForgotPassword()}
                    disabled={resetBusy}
                  >
                    {resetBusy ? "Sending…" : "Forgot password?"}
                  </button>
                </div>
              )}
            </div>
            </div>

            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            {resetMessage && (
              <p className="text-center text-sm text-muted-foreground">{resetMessage}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full min-w-0 items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
