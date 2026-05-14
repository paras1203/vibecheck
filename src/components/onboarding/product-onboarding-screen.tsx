"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/context/AuthContext";
import {
  ONBOARDING_GOAL_OPTIONS,
  ONBOARDING_ROLE_OPTIONS,
} from "@/lib/onboarding-options";
import { clearPendingAuditUrl } from "@/lib/pending-audit-url";
import { cn } from "@/lib/utils";

type FieldKey = "displayName" | "role" | "goal";

const STEP_TITLES = ["Your details", "Your goal"] as const;
const STEP_DESC = [
  "How should we address you, and what best describes your role?",
  "What do you want audits to focus on? Choose one to finish setup.",
] as const;

export function ProductOnboardingScreen() {
  const ok = useRequireAuth();
  const router = useRouter();
  const { user, completeProductOnboarding, isSyncing } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitBusy, setSubmitBusy] = useState(false);

  useEffect(() => {
    setDisplayName((d) => (d.trim() ? d : user?.displayName?.trim() || ""));
  }, [user?.displayName]);

  useEffect(() => {
    if (!ok || !user?.firestoreSynced || !user.onboardingCompleted) return;
    router.replace("/");
  }, [ok, user, router]);

  const validateStep = (s: number): Partial<Record<FieldKey, string>> => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (s === 0) {
      if (!displayName.trim()) next.displayName = "Enter your name.";
      if (!role) next.role = "Choose your role.";
    } else {
      if (!goal) next.goal = "Choose your goal.";
    }
    return next;
  };

  const goNext = () => {
    const errs = validateStep(step);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep((x) => Math.min(1, x + 1));
  };

  const goBack = () => {
    setFieldErrors({});
    setStep((x) => Math.max(0, x - 1));
  };

  const onSubmit = async () => {
    const errs = validateStep(1);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const trimmedName = displayName.trim();
    setSubmitBusy(true);
    try {
      await completeProductOnboarding({
        displayName: trimmedName,
        onboardingRole: role,
        onboardingGoal: goal,
      });
      clearPendingAuditUrl();
      router.replace("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Try again in a moment.";
      toast.error("Could not save your setup", { description: msg });
    } finally {
      setSubmitBusy(false);
    }
  };

  if (!ok) return null;

  const busy = submitBusy || isSyncing;

  return (
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground">
      <Navbar landingVisualId="a1" showLandingVariationSwitcher={false} navMode="concept" tone="default" />
      <main className="w-full min-w-0 overflow-x-clip px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-8 space-y-2 text-center">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Get set up
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Two quick steps so we can personalize your experience.
            </p>
            <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
              Step {step + 1} of 2
            </p>
          </div>

          <section
            className={cn(
              "flex min-h-[min(420px,70dvh)] flex-col rounded-2xl border border-border bg-card p-6 shadow-surface-sm md:p-8",
            )}
          >
            <div className="min-h-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                {STEP_TITLES[step]}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{STEP_DESC[step]}</p>

              <div className="mt-6 space-y-5">
                {step === 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="onboarding-name">Name</Label>
                      <Input
                        id="onboarding-name"
                        type="text"
                        autoComplete="name"
                        placeholder="Jordan Smith"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={busy}
                        className={cn("h-11", fieldErrors.displayName && "border-destructive")}
                        aria-invalid={Boolean(fieldErrors.displayName)}
                      />
                      {fieldErrors.displayName ? (
                        <p className="text-sm text-destructive" role="alert">
                          {fieldErrors.displayName}
                        </p>
                      ) : null}
                    </div>
                    <fieldset className="space-y-3" disabled={busy}>
                      <legend className="text-sm font-medium text-foreground">Your role</legend>
                      <div
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2.5"
                        role="radiogroup"
                        aria-label="Your role"
                      >
                        {ONBOARDING_ROLE_OPTIONS.map((opt) => (
                          <label
                            key={opt.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-0.5 hover:bg-muted/40"
                          >
                            <input
                              type="radio"
                              name="onboarding-role"
                              value={opt.id}
                              checked={role === opt.id}
                              onChange={() => setRole(opt.id)}
                              className="mt-1 h-4 w-4 shrink-0 accent-primary"
                            />
                            <span className="text-left text-sm leading-snug text-foreground">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {fieldErrors.role ? (
                        <p className="text-sm text-destructive" role="alert">
                          {fieldErrors.role}
                        </p>
                      ) : null}
                    </fieldset>
                  </>
                ) : null}

                {step === 1 ? (
                  <fieldset className="space-y-3" disabled={busy}>
                    <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Your goal">
                      {ONBOARDING_GOAL_OPTIONS.map((opt) => (
                        <label
                          key={opt.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-0.5 hover:bg-muted/40"
                        >
                          <input
                            type="radio"
                            name="onboarding-goal"
                            value={opt.id}
                            checked={goal === opt.id}
                            onChange={() => setGoal(opt.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-primary"
                          />
                          <span className="text-sm leading-snug text-foreground">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.goal ? (
                      <p className="text-sm text-destructive" role="alert">
                        {fieldErrors.goal}
                      </p>
                    ) : null}
                  </fieldset>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                className="min-w-[6rem]"
                onClick={goBack}
                disabled={busy || step === 0}
              >
                Back
              </Button>
              <div className="flex flex-1 justify-end gap-2">
                {step < 1 ? (
                  <Button type="button" className="min-w-[7rem] font-semibold" onClick={goNext} disabled={busy}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="min-w-[10rem] font-semibold"
                    onClick={() => void onSubmit()}
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
