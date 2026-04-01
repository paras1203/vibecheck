"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWorkspaceName, setWorkspaceName } from "@/lib/workspace-name";
import type { User } from "@/context/AuthContext";
import { Pencil, Check } from "lucide-react";

type Props = {
  user: User | null;
};

export function WorkspaceTitle({ user }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const defaultTitle = "Your workspace";

  useEffect(() => {
    setName(getWorkspaceName(user?.uid) ?? defaultTitle);
  }, [user?.uid]);

  const save = () => {
    const t = name.trim() || defaultTitle;
    setWorkspaceName(user?.uid, t === defaultTitle ? "" : t);
    setEditing(false);
  };

  const stored = getWorkspaceName(user?.uid);
  const display = stored ?? defaultTitle;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {user?.displayName || user?.email || "Account"}
        </span>
        <span aria-hidden>·</span>
        <span>Plan</span>
        <Badge variant="secondary" className="align-middle capitalize">
          {user?.plan || "free"}
        </Badge>
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="max-w-md font-semibold"
                placeholder={defaultTitle}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") {
                    setName(getWorkspaceName(user?.uid) ?? defaultTitle);
                    setEditing(false);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={save}>
                  <Check className="size-4" aria-hidden />
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setName(getWorkspaceName(user?.uid) ?? defaultTitle);
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">{display}</h1>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0"
                aria-label="Edit workspace name"
                onClick={() => {
                  setName(getWorkspaceName(user?.uid) ?? defaultTitle);
                  setEditing(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
