"use client";

import type { ReactNode } from "react";
import { RoastSessionProvider } from "@/context/RoastSessionContext";

export function RoastSessionRoot({ children }: { children: ReactNode }) {
  return <RoastSessionProvider>{children}</RoastSessionProvider>;
}
