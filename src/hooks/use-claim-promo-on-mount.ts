"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

/** Best-effort: claims one promo-registration credit server-side if pool has slots and user never claimed. */
export function useClaimPromoOnMount() {
  const { firebaseUser, refreshProfile, updateCredits } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!firebaseUser || ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch("/api/user/claim-promo-registration", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = (await res.json().catch(() => ({}))) as {
          granted?: boolean;
          creditsAfter?: number;
        };
        if (res.ok && j.granted === true && typeof j.creditsAfter === "number") {
          updateCredits(j.creditsAfter, { fromServer: true });
        }
        await refreshProfile();
      } catch {
        /* ignore */
      }
    })();
  }, [firebaseUser, refreshProfile, updateCredits]);
}
