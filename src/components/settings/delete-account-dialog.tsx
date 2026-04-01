"use client";

import { useState } from "react";
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
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal-contact";

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
          Delete account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription className="space-y-3 text-left">
            <span className="block">
              To close your account and request deletion of personal data we hold (subject to legal
              retention), email{" "}
              <a className="text-foreground underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
                {LEGAL_CONTACT_EMAIL}
              </a>{" "}
              from your registered address. We will verify ownership and process your request as described
              in our Privacy Policy.
            </span>
            <span className="block text-muted-foreground">
              Reports saved only in your browser can be cleared by removing site data for this app or using
              your browser settings.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button type="button" variant="destructive" asChild>
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent("SiteRoast account deletion")}`}
            >
              Email request
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
