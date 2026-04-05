import type { User } from "@/context/AuthContext";

export function formatCreditsBalance(user: User | null | undefined): string {
  if (!user) return "—";
  if (!user.firestoreSynced) return "—";
  return String(user.credits);
}
