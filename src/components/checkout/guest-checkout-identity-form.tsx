"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export function GuestCheckoutIdentityForm() {
  const { firebaseUser, refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    if (!firebaseUser) return;
    setError(null);
    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }
    setBusy(true);
    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch("/api/user/guest-checkout-contact", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data?.error ?? "Could not save");
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Almost there</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the email for your receipt. After payment you can{" "}
        <Link href="/login?mode=signup" className="text-primary underline-offset-4 hover:underline">
          create a full account
        </Link>
        {" — "}
        we&apos;ll carry over credits from this checkout.
      </p>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guest-email">Email</Label>
          <Input
            id="guest-email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guest-name">Name (optional)</Label>
          <Input
            id="guest-name"
            type="text"
            autoComplete="name"
            value={displayName}
            disabled={busy}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <Button type="button" className="w-full" disabled={busy} onClick={() => void onContinue()}>
          {busy ? "Saving…" : "Continue to payment"}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
