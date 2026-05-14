"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function PendingHomeMessageBanner() {
  const { user, dismissPendingHomeMessage } = useAuth();
  const msg = user?.pendingHomeMessage;
  if (!msg) return null;

  return (
    <Alert className="border-primary/35 bg-primary/5">
      <AlertTitle className="text-foreground">Credit update</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{msg}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => void dismissPendingHomeMessage()}
        >
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}
