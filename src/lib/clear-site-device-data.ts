import { workspaceNameKey } from "@/lib/workspace-name";

const LEGACY_HISTORY = "siteroast_roast_history";

/** Clears locally cached roasts and workspace keys for this device (browser). */
export function clearSiteRoastDeviceCaches(uid: string | undefined): void {
  if (typeof window === "undefined") return;
  try {
    const ls = window.localStorage;
    for (const k of Object.keys(ls)) {
      if (k.startsWith("roast_")) {
        ls.removeItem(k);
      }
    }
    ls.removeItem("emailForSignIn");
    ls.removeItem("leadEmail");
    ls.removeItem(LEGACY_HISTORY);
    if (uid) {
      ls.removeItem(`siteroast_roast_history_${uid}`);
      ls.removeItem(workspaceNameKey(uid));
    }
    ls.removeItem(workspaceNameKey(undefined));
  } catch {
    /* ignore */
  }
  try {
    const ss = window.sessionStorage;
    for (const k of Object.keys(ss)) {
      if (k.startsWith("roast_")) {
        ss.removeItem(k);
      }
    }
  } catch {
    /* ignore */
  }
}
