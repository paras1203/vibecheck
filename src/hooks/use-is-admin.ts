import { useAuth } from "@/context/AuthContext";
import { isAdminEmail } from "@/lib/admin";

export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return isAdminEmail(user?.email);
}
