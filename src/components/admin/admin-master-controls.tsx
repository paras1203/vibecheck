"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

type SearchRow = { uid: string; email: string; plan: string };

type UserSummary = {
  uid: string;
  email: string;
  credits: number;
  plan: string;
  roastsInRange: number;
  avgTotalTokensPerRoast: number;
  sumEstimatedCostUsd: number;
};

export function AdminMasterControls({ analyticsRange }: { analyticsRange: string }) {
  const { firebaseUser } = useAuth();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchRow[]>([]);
  const [selected, setSelected] = useState<SearchRow | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<UserSummary | null>(null);

  const [promoSlots, setPromoSlots] = useState("50");
  const [promoPer, setPromoPer] = useState("1");
  const [promoBusy, setPromoBusy] = useState(false);

  const [grantCredits, setGrantCredits] = useState("1");
  const [grantReason, setGrantReason] = useState("");
  const [grantBusy, setGrantBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const authedFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      const token = await firebaseUser!.getIdToken();
      return fetch(input, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });
    },
    [firebaseUser],
  );

  const runSearch = useCallback(async () => {
    if (!firebaseUser) return;
    setSearchBusy(true);
    setActionMsg(null);
    try {
      const res = await authedFetch(`/api/admin/users/search?q=${encodeURIComponent(q.trim())}`);
      const j = (await res.json()) as { users?: SearchRow[] };
      setHits(Array.isArray(j.users) ? j.users : []);
    } finally {
      setSearchBusy(false);
    }
  }, [firebaseUser, authedFetch, q]);

  const loadSummary = useCallback(
    async (uid: string) => {
      if (!firebaseUser) return;
      setSummaryLoading(true);
      setSummary(null);
      try {
        const res = await authedFetch(
          `/api/admin/users/${encodeURIComponent(uid)}/summary?range=${encodeURIComponent(analyticsRange)}`,
        );
        const j = (await res.json()) as UserSummary & { error?: string };
        if (!res.ok) throw new Error(j.error || "Failed");
        setSummary(j);
      } catch {
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    },
    [firebaseUser, authedFetch, analyticsRange],
  );

  useEffect(() => {
    if (selected?.uid) void loadSummary(selected.uid);
  }, [selected?.uid, loadSummary]);

  const submitPromoPool = async () => {
    if (!firebaseUser) return;
    const addSlots = Math.floor(Number(promoSlots));
    const per = Math.floor(Number(promoPer));
    if (!Number.isFinite(addSlots) || addSlots <= 0) {
      setActionMsg("Enter a positive whole number for promo pool.");
      return;
    }
    setPromoBusy(true);
    setActionMsg(null);
    try {
      const res = await authedFetch("/api/admin/promo-registration", {
        method: "POST",
        body: JSON.stringify({
          addSlots,
          ...(Number.isFinite(per) && per > 0 ? { creditsPerRegistration: per } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setActionMsg(typeof j.error === "string" ? j.error : "Promo update failed");
        return;
      }
      setActionMsg(`Added ${addSlots} promo signup slot(s).`);
    } finally {
      setPromoBusy(false);
    }
  };

  const submitGrant = async () => {
    if (!firebaseUser || !selected) return;
    const n = Math.floor(Number(grantCredits));
    if (!Number.isFinite(n) || n <= 0) {
      setActionMsg("Enter bonus credits as a positive whole number.");
      return;
    }
    setGrantBusy(true);
    setActionMsg(null);
    try {
      const res = await authedFetch("/api/admin/grant-credits", {
        method: "POST",
        body: JSON.stringify({
          uid: selected.uid,
          credits: n,
          ...(grantReason.trim() ? { reason: grantReason.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setActionMsg(typeof j.error === "string" ? j.error : "Grant failed");
        return;
      }
      setActionMsg(`Granted ${n} credit(s) to ${selected.email}.`);
      void loadSummary(selected.uid);
    } finally {
      setGrantBusy(false);
    }
  };

  if (!firebaseUser) return null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Promo credits (new registrations)</CardTitle>
          <CardDescription>
            Add slots to the pool; each new signup claims at most once while slots remain (1 credit
            each by default).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="promo-slots">Free signup slots to add</Label>
            <Input
              id="promo-slots"
              inputMode="numeric"
              value={promoSlots}
              onChange={(e) => setPromoSlots(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-per">Credits per signup</Label>
            <Input
              id="promo-per"
              inputMode="numeric"
              value={promoPer}
              onChange={(e) => setPromoPer(e.target.value)}
              className="w-28"
            />
          </div>
          <Button type="button" disabled={promoBusy} onClick={() => void submitPromoPool()}>
            {promoBusy ? <Loader2 className="size-4 animate-spin" /> : null}
            Add promo quota
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User lookup & bonus credits</CardTitle>
          <CardDescription>
            Search users by email prefix; select one to see credits and roasts in the selected
            range, then grant bonus credits (user sees message on home/dashboard).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="user-q">Email contains / prefix</Label>
              <Input
                id="user-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="user@domain.com"
              />
            </div>
            <Button type="button" variant="secondary" disabled={searchBusy} onClick={() => void runSearch()}>
              {searchBusy ? <Loader2 className="size-4 animate-spin" /> : null}
              Search
            </Button>
          </div>

          {hits.length > 0 ? (
            <div className="rounded-lg border border-border">
              <ul className="max-h-44 divide-y divide-border overflow-y-auto text-sm">
                {hits.map((h) => (
                  <li key={h.uid}>
                    <button
                      type="button"
                      className={`flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50 ${selected?.uid === h.uid ? "bg-muted/60" : ""}`}
                      onClick={() => setSelected(h)}
                    >
                      <span className="min-w-0 truncate font-mono text-xs">{h.email}</span>
                      <span className="shrink-0 text-muted-foreground">{h.plan}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {selected ? (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Selected: <span className="font-mono text-xs">{selected.email}</span>
              </p>
              {summaryLoading ? (
                <p className="text-sm text-muted-foreground">Loading user metrics…</p>
              ) : summary ? (
                <ul className="space-y-1 text-sm">
                  <li>
                    Credits:{" "}
                    <strong className="tabular-nums text-foreground">{summary.credits}</strong>
                  </li>
                  <li>
                    Plan: <strong className="text-foreground">{summary.plan}</strong>
                  </li>
                  <li>
                    Roasts in range ({analyticsRange}):{" "}
                    <strong className="tabular-nums text-foreground">{summary.roastsInRange}</strong>
                  </li>
                  <li>
                    Avg tokens / roast:{" "}
                    <strong className="tabular-nums text-foreground">
                      {summary.avgTotalTokensPerRoast.toLocaleString()}
                    </strong>
                  </li>
                  <li>
                    Est. LLM cost sum:{" "}
                    <strong className="tabular-nums text-foreground">
                      ${summary.sumEstimatedCostUsd.toFixed(4)}
                    </strong>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Could not load summary.</p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="grant-n">Bonus credits</Label>
                  <Input
                    id="grant-n"
                    inputMode="numeric"
                    value={grantCredits}
                    onChange={(e) => setGrantCredits(e.target.value)}
                    className="w-28"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="grant-reason">Reason (optional)</Label>
                  <Input
                    id="grant-reason"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    placeholder="e.g. Support goodwill"
                  />
                </div>
                <Button type="button" disabled={grantBusy} onClick={() => void submitGrant()}>
                  {grantBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Grant credits
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a user from search results.</p>
          )}
        </CardContent>
      </Card>

      {actionMsg ? (
        <p className="text-sm text-muted-foreground" role="status">
          {actionMsg}
        </p>
      ) : null}
    </div>
  );
}
