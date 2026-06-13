"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CategoryFilterId } from "@/lib/eventCategories";
import {
  readCategoryFilterFromUrl,
  readCampusFilterFromUrl,
  writeMapFiltersToUrl,
} from "@/lib/mapFilterUrl";

type MapFilterContextValue = {
  filter: CategoryFilterId;
  setFilter: (id: CategoryFilterId) => void;
};

const MapFilterContext = createContext<MapFilterContextValue | null>(null);

export function MapFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<CategoryFilterId>("all");

  useEffect(() => {
    setFilterState(readCategoryFilterFromUrl());
  }, []);

  const setFilter = useCallback((id: CategoryFilterId) => {
    setFilterState(id);
    writeMapFiltersToUrl(readCampusFilterFromUrl(), id);
  }, []);

  const value = useMemo(() => ({ filter, setFilter }), [filter, setFilter]);

  return <MapFilterContext.Provider value={value}>{children}</MapFilterContext.Provider>;
}

export function useMapFilter() {
  const ctx = useContext(MapFilterContext);
  if (!ctx) throw new Error("useMapFilter must be used within MapFilterProvider");
  return ctx;
}
