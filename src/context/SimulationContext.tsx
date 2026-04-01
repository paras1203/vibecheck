"use client";

import { createContext, useContext, ReactNode } from "react";

interface SimulationContextType {
  mode: "live";
  toggleMode: () => void;
  isLive: boolean;
}

const liveValue: SimulationContextType = {
  mode: "live",
  toggleMode: () => {},
  isLive: true,
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  return (
    <SimulationContext.Provider value={liveValue}>{children}</SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}

