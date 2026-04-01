"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export function useResetUserData() {
  const { user, logout } = useAuth();

  const resetUserData = useCallback(async () => {
    if (!user) {
      alert("You must be logged in to reset your data.");
      return;
    }
    if (!confirm("Are you sure you want to reset all your data? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch("/api/debug/reset-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset user data");
      }
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("roast_")) localStorage.removeItem(key);
      });
      localStorage.removeItem("emailForSignIn");
      await logout();
      window.location.reload();
    } catch (err) {
      console.error("Reset failed:", err);
      alert(err instanceof Error ? err.message : "Failed to reset user data");
    }
  }, [user, logout]);

  return { resetUserData };
}
