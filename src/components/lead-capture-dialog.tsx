"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BLOCKED_DOMAINS = ["xyz.com", "test.com", "abc.com"];

const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return !BLOCKED_DOMAINS.includes(domain || "");
    },
    {
      message: "Please use a work email address",
    }
  )
  .refine(
    (email) => {
      const [localPart, domain] = email.split("@");
      if (!localPart || !domain) return false;
      
      const hasRepeatingChars = /(.)\1{2,}/.test(localPart) || /(.)\1{2,}/.test(domain);
      return !hasRepeatingChars;
    },
    {
      message: "Please use a valid work email address",
    }
  );

interface LeadCaptureDialogProps {
  open: boolean;
  onEmailSubmit: (email: string) => void;
}

export function LeadCaptureDialog({ open, onEmailSubmit }: LeadCaptureDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const validatedEmail = emailSchema.parse(email.trim());
      localStorage.setItem("leadEmail", validatedEmail);
      onEmailSubmit(validatedEmail);
      setEmail("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || "Invalid email address");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent
        className="sm:max-w-md border-border bg-background [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-foreground">
            Your Roast is Ready.
          </DialogTitle>
          <DialogDescription className="pt-2 text-center text-muted-foreground">
            Enter your work email to unlock the report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className="h-12 border-border bg-background text-lg text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="h-12 w-full text-lg font-semibold"
          >
            {isSubmitting ? "Unlocking..." : "Unlock Report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
