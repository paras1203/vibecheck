const prefix = "siteroast_workspace_name";

export function workspaceNameKey(uid: string | undefined): string {
  return uid ? `${prefix}_${uid}` : `${prefix}_anon`;
}

export function getWorkspaceName(uid: string | undefined): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(workspaceNameKey(uid));
    return v?.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setWorkspaceName(uid: string | undefined, name: string): void {
  if (typeof window === "undefined") return;
  const t = name.trim();
  if (!t) {
    localStorage.removeItem(workspaceNameKey(uid));
    return;
  }
  localStorage.setItem(workspaceNameKey(uid), t);
}
