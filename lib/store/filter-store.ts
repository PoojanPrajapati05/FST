// Persisted Zustand Filter Store for expense and transaction exploration.
// Isolated slices ensure selective subscriptions without re-rendering layout.tsx or parent trees.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMounted } from "@/lib/use-mounted";

interface FilterState {
  groupId: string;
  category: string;
  searchQuery: string;
  startDate: string;
  endDate: string;
  setGroupId: (id: string) => void;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (start: string, end: string) => void;
  resetFilters: () => void;
}

const initialFilters = {
  groupId: "ALL",
  category: "ALL",
  searchQuery: "",
  startDate: "",
  endDate: "",
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ...initialFilters,
      setGroupId: (groupId) => set({ groupId }),
      setCategory: (category) => set({ category }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setDateRange: (startDate, endDate) => set({ startDate, endDate }),
      resetFilters: () => set(initialFilters),
    }),
    {
      name: "splitease-filter-panel-storage",
    }
  )
);

/**
 * Hydration-safe hook for accessing filter panel state
 */
export function useFilterState() {
  const isHydrated = useMounted();
  const state = useFilterStore();

  return {
    isHydrated,
    groupId: isHydrated ? state.groupId : "ALL",
    category: isHydrated ? state.category : "ALL",
    searchQuery: isHydrated ? state.searchQuery : "",
    startDate: isHydrated ? state.startDate : "",
    endDate: isHydrated ? state.endDate : "",
    setGroupId: state.setGroupId,
    setCategory: state.setCategory,
    setSearchQuery: state.setSearchQuery,
    setDateRange: state.setDateRange,
    resetFilters: state.resetFilters,
  };
}
