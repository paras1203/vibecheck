"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";
import {
  ACCOUNT_DELETION_CONFIRM_PHRASE,
  deletionConfirmationMatches,
} from "@/lib/account-deletion-constants";
import { clearSiteRoastDeviceCaches } from "@/lib/clear-site-device-data";
import { useAuth } from "@/context/AuthContext";

export function DeleteAccountDialog() {
  const router = useRouter();
  const { user, firebaseUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setConfirmation("");
    setAcknowledged(false);
    setError(null);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handleDelete = async () => {
    setError(null);
    if (!firebaseUser || !user) {
      setError("You must be signed in to delete your account.");
      return;
    }
    if (!acknowledged) {
      setError("Confirm the checkbox below first.");
      return;
    }
    if (!deletionConfirmationMatches(confirmation)) {
      setError(`Type: ${ACCOUNT_DELETION_CONFIRM_PHRASE} (any casing)`);
      return;
    }

    setBusy(true);
    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmation: confirmation.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Deletion failed");
      }

      const uid = user.uid;
      clearSiteRoastDeviceCaches(uid);
      await logout();
      setOpen(false);
      resetForm();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-auto max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription className="space-y-3 text-left text-foreground">
            <span className="block text-sm font-medium text-destructive">Permanent — cannot be undone.</span>
            <span className="block text-sm text-muted-foreground">
              We delete your Firebase account and remove your profile, plan/credits, roasts, scans, and
              analytics tied to your user id (including URLs you submitted). See our{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy Policy
              </Link>{" "}
              for legal rights (e.g. GDPR/CCPA) and limits.
            </span>
            <span className="block text-sm font-medium text-foreground">We may keep</span>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Billing/transaction records as required (detached from your account where possible)</li>
              <li>Backup copies for a limited time per provider policy</li>
            </ul>
            <span className="block text-sm text-muted-foreground">
              This browser&apos;s saved reports and history are cleared here; other devices are not.
            </span>
            <span className="block text-sm text-muted-foreground">
              Need help?{" "}
              <a className="text-foreground underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
                {LEGAL_CONTACT_EMAIL}
              </a>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-1 size-4 shrink-0 rounded border border-input"
              checked={acknowledged}
              onChange={(ev) => setAcknowledged(ev.target.checked)}
            />
            <span>I understand my account and the data above will be removed.</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm" className="text-foreground">
              Type{" "}
              <span className="font-mono text-sm font-normal text-muted-foreground">
                {ACCOUNT_DELETION_CONFIRM_PHRASE}
              </span>{" "}
              (any casing) to confirm
            </Label>
            <Input
              id="delete-account-confirm"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={busy}
              placeholder={ACCOUNT_DELETION_CONFIRM_PHRASE}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || !firebaseUser}
            onClick={() => void handleDelete()}
          >
            {busy ? "Deleting…" : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
