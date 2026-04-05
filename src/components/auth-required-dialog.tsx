"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onAuthSuccess: () => void;
  onGoogleAuth: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<void>;
  onEmailSignUp: (email: string, password: string) => Promise<void>;
  onSendEmailLink?: (email: string) => Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
  footerNote?: string;
  allowDismiss?: boolean;
}

const DEFAULT_TITLE = "Sign in to continue";
const DEFAULT_DESCRIPTION = "Exports and saved history are available with an account.";
const DEFAULT_FOOTER = "By continuing, you agree to our use of authentication for your workspace.";

export function AuthRequiredDialog({
  open,
  onOpenChange,
  onAuthSuccess,
  onGoogleAuth,
  onEmailSignIn,
  onEmailSignUp,
  onSendEmailLink,
  loading = false,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  footerNote = DEFAULT_FOOTER,
  allowDismiss = false,
}: AuthRequiredDialogProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleGoogle = async () => {
    setLocalError(null);
    try {
      await onGoogleAuth();
      onAuthSuccess();
    } catch (error) {
      console.error("Authentication failed:", error);
      setLocalError(error instanceof Error ? error.message : "Google sign-in failed");
    }
  };

  const handleEmailLink = async () => {
    if (!onSendEmailLink) return;
    setLocalError(null);
    setLinkSent(false);
    if (!email.trim()) {
      setLocalError("Enter your email to receive a sign-in link.");
      return;
    }
    setLinkBusy(true);
    try {
      await onSendEmailLink(email.trim());
      setLinkSent(true);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Could not send sign-in link");
    } finally {
      setLinkBusy(false);
    }
  };

  const handleEmail = async () => {
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError("Enter email and password.");
      return;
    }
    try {
      if (mode === "signup") {
        await onEmailSignUp(email, password);
      } else {
        await onEmailSignIn(email, password);
      }
      onAuthSuccess();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Email sign-in failed");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next === false && !allowDismiss) return;
        onOpenChange?.(next);
      }}
      modal={true}
    >
      <DialogContent
        className="border-border bg-background sm:max-w-md"
        onInteractOutside={(e) => {
          if (!allowDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!allowDismiss) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-center text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Button
            onClick={handleGoogle}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
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
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          <div className="relative py-2 text-center text-xs text-muted-foreground">
            <span className="bg-background px-2">or email</span>
          </div>

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
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              type="button"
              onClick={handleEmail}
              disabled={loading}
              className="h-11 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Log in with email"
              )}
            </Button>
            {mode === "signin" && onSendEmailLink ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleEmailLink}
                disabled={loading || linkBusy}
                className="h-10 w-full text-sm"
              >
                {linkBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Email me a sign-in link"
                )}
              </Button>
            ) : null}
          </div>

          {linkSent && (
            <p className="text-center text-sm text-muted-foreground">
              Check your email for the link. Open it on this device if you started here.
            </p>
          )}

          {localError && (
            <p className="text-center text-sm text-destructive">{localError}</p>
          )}

          <p className="text-center text-xs text-muted-foreground">{footerNote}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
