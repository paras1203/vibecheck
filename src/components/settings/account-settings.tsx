"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Pencil, Check } from "lucide-react";

export function AccountSettings() {
  const { user, updateDisplayName, sendPasswordResetToEmail } = useAuth();
  const [name, setName] = useState(user?.displayName ?? "");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    setName(user?.displayName ?? "");
  }, [user?.displayName]);

  const email = user?.email ?? "";
  const onSaveName = async () => {
    setSavingName(true);
    try {
      await updateDisplayName(name);
      toast.success("Name updated");
      setEditingName(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update name");
    } finally {
      setSavingName(false);
    }
  };

  const onChangePassword = async () => {
    if (!email) {
      toast.error("No email on this account.");
      return;
    }
    setSendingReset(true);
    try {
      await sendPasswordResetToEmail(email);
      toast.success("Check your inbox for a reset link.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  const displayName = user?.displayName?.trim() || null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label>Name</Label>
        {editingName ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={savingName}
              placeholder="Your name"
              autoComplete="name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSaveName();
                if (e.key === "Escape") {
                  setName(user?.displayName ?? "");
                  setEditingName(false);
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-2"
                onClick={() => void onSaveName()}
                disabled={savingName || !name.trim()}
              >
                {savingName ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setName(user?.displayName ?? "");
                  setEditingName(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">{displayName ?? "—"}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Edit name"
              onClick={() => {
                setName(user?.displayName ?? "");
                setEditingName(true);
              }}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-email">Email</Label>
        <Input id="settings-email" type="email" value={email} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Tied to your sign-in provider. Use another account to change email.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Password</Label>
        <p className="text-xs text-muted-foreground">
          Google accounts use Google to sign in. Email/password accounts can reset via email.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void onChangePassword()}
          disabled={sendingReset || !email}
        >
          {sendingReset ? <Loader2 className="size-4 animate-spin" /> : null}
          Change password
        </Button>
      </div>

    </div>
  );
}
