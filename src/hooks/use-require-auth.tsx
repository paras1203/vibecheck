"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useRequireAuth() {
  const { user, loading, authResolved } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!authResolved || loading) return;
    if (!user) {
      const safeNext =
        pathname.startsWith("/") && !pathname.startsWith("//") && pathname !== "/login"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
      router.replace(`/login${safeNext}`);
    }
  }, [user, loading, authResolved, router, pathname]);

  return authResolved && !loading && !!user;
}

