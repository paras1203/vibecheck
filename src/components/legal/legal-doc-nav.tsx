"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function LegalDocNavLinks() {
  const { user, firebaseUser, loading } = useAuth();
  const authedForApp = Boolean(user && firebaseUser);
  const homeHref = !loading && authedForApp ? "/dashboard" : "/";

  return (
    <>
      <Link href={homeHref} className="text-sm font-semibold tracking-tight text-foreground hover:underline">
        SiteRoast
      </Link>
      <Link href={homeHref} className="text-sm text-muted-foreground hover:text-foreground">
        Home
      </Link>
    </>
  );
}
