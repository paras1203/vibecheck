"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useRequireAuth() {
  const { user, loading, authResolved } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authResolved || loading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, loading, authResolved, router]);

  return authResolved && !loading && !!user;
}

