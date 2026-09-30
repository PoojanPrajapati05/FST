"use client";
// 'use client' boundary required: ExpenseListView reads filter store state, applies client-side search filtering, and implements useOptimistic for immediate UI feedback.

import * as React from "react";
import { useOptimistic } from "react";
import { useFilterState } from "@/lib/store/filter-store";
import { formatPaiseToINR } from "@/lib/settle";
import { Badge } from "@/components/ui/badge";
import { Receipt, Calendar, ArrowUpRight, ArrowDownLeft, User } from "lucide-react";
import Link from "next/link";

export interface SerializedExpense {
  id: string;
  groupId: string;
  groupName?: string;
  description: string;
  category: string;
  amount: number; // in paise
  splitType: string;
  date: string; // ISO string
  paidById: string;
  paidByName: string;
  userShareAmount?: number; // what current user owes/paid
  shares: {
    userId: string;
    userName: string;
    amount: number;
    percentage?: number | null;
  }[];
}

interface ExpenseListViewProps {
  initialExpenses: SerializedExpense[];
  currentUserId: string;
  showGroupName?: boolean;
}

export function ExpenseListView({
  initialExpenses,
  currentUserId,
  showGroupName = false,
}: ExpenseListViewProps) {
  const { searchQuery, category, groupId } = useFilterState();

  // Optimistic UI for immediate feedback
  const [optimisticExpenses] = useOptimistic(
    initialExpenses,
    (state, newExpense: SerializedExpense) => [newExpense, ...state]
  );

  // Client-side filtering driven by persisted Zustand Filter Store
  const filteredExpenses = optimisticExpenses.filter((exp) => {
    // 1. Group filter
    if (groupId !== "ALL" && exp.groupId !== groupId) return false;

    // 2. Category filter
    if (category !== "ALL" && exp.category !== category) return false;

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = exp.description.toLowerCase().includes(q);
      const matchPayer = exp.paidByName.toLowerCase().includes(q);
      const matchGroup = exp.groupName?.toLowerCase().includes(q);
      if (!matchDesc && !matchPayer && !matchGroup) return false;
    }

    return true;
  });

  if (filteredExpenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
        <Receipt className="h-12 w-12 text-slate-400 mb-3 stroke-[1.5]" />
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No expenses found
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          No expenses match your current filters. Add a new expense or clear your filters to view history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredExpenses.map((exp) => {
        const isPayer = exp.paidById === currentUserId;
        const myShare = exp.shares.find((s) => s.userId === currentUserId);
        const mySharePaise = myShare?.amount || 0;

        return (
          <div
            key={exp.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/80 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs ${
                  isPayer
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                }`}
              >
                {isPayer ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                    {exp.description}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0 font-medium">
                    {exp.category}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-2 py-0 border-slate-300">
                    {exp.splitType}
                  </Badge>
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <strong>{isPayer ? "You" : exp.paidByName}</strong> paid
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(exp.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {showGroupName && exp.groupName && (
                    <>
                      <span>•</span>
                      <Link
                        href={`/groups/${exp.groupId}`}
                        className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                      >
                        {exp.groupName}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {formatPaiseToINR(exp.amount)}
              </span>

              {isPayer ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  You lent {formatPaiseToINR(exp.amount - mySharePaise)}
                </span>
              ) : myShare ? (
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  You owe {formatPaiseToINR(mySharePaise)}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Not involved</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
