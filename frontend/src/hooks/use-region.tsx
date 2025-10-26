import React, { createContext, useContext, useState, useEffect } from "react";

type Region = "global" | "indian";

interface RegionContextType {
  region: Region;
  setRegion: (region: Region) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegion] = useState<Region>("global");

  // Load region preference from localStorage on mount
  useEffect(() => {
    const savedRegion = localStorage.getItem("newsRegion") as Region;
    if (savedRegion && (savedRegion === "global" || savedRegion === "indian")) {
      setRegion(savedRegion);
    }
  }, []);

  // Save region preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("newsRegion", region);
  }, [region]);

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegion must be used within a RegionProvider");
  }
  return context;
}
