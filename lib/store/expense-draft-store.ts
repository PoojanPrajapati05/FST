// 'use client' boundary not needed here (pure TS module), but consumed strictly in Client Components.
// Zustand is UI-only client draft state and is NEVER trusted by the server.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useMounted } from "@/lib/use-mounted";

export interface ExpenseDraftData {
  description: string;
  amountRupees: string;
  category: string;
  paidById: string;
  splitType: "EQUAL" | "EXACT" | "PERCENT";
  participantUserIds: string[];
  exactSharesRupees: Record<string, number>;
  percentShares: Record<string, number>;
}

const defaultDraft: ExpenseDraftData = {
  description: "",
  amountRupees: "",
  category: "GENERAL",
  paidById: "",
  splitType: "EQUAL",
  participantUserIds: [],
  exactSharesRupees: {},
  percentShares: {},
};

interface ExpenseDraftStore {
  drafts: Record<string, ExpenseDraftData>;
  setDraft: (groupId: string, data: Partial<ExpenseDraftData>) => void;
  clearDraft: (groupId: string) => void;
}

export const useExpenseDraftStore = create<ExpenseDraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (groupId, data) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [groupId]: {
              ...(state.drafts[groupId] || defaultDraft),
              ...data,
            },
          },
        })),
      clearDraft: (groupId) =>
        set((state) => {
          const next = { ...state.drafts };
          delete next[groupId];
          return { drafts: next };
        }),
    }),
    {
      name: "splitease-expense-draft-storage",
    }
  )
);

/**
 * Hydration-safe custom hook for component consumption
 */
export function useExpenseDraft(groupId: string) {
  const isHydrated = useMounted();
  const draft = useExpenseDraftStore((s) => s.drafts[groupId]) || defaultDraft;
  const setDraft = useExpenseDraftStore((s) => s.setDraft);
  const clearDraft = useExpenseDraftStore((s) => s.clearDraft);

  return {
    isHydrated,
    draft: isHydrated ? draft : defaultDraft,
    setDraft: (data: Partial<ExpenseDraftData>) => setDraft(groupId, data),
    clearDraft: () => clearDraft(groupId),
  };
}
