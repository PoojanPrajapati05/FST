"use client";
// 'use client' boundary required: FilterPanel consumes persisted Zustand state, manages filter controls and resets.

import * as React from "react";
import { useFilterState } from "@/lib/store/filter-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EXPENSE_CATEGORIES } from "@/lib/validations/expense";
import { Search, Filter, RotateCcw } from "lucide-react";

interface FilterPanelProps {
  groups?: { id: string; name: string }[];
  showGroupSelect?: boolean;
}

export function FilterPanel({ groups = [], showGroupSelect = true }: FilterPanelProps) {
  const {
    groupId,
    category,
    searchQuery,
    setGroupId,
    setCategory,
    setSearchQuery,
    resetFilters,
  } = useFilterState();

  const isFiltered =
    (showGroupSelect && groupId !== "ALL") ||
    category !== "ALL" ||
    searchQuery.trim() !== "";

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-xl border border-slate-200/80 bg-white/70 shadow-xs backdrop-blur-xs dark:border-slate-800/80 dark:bg-slate-900/60">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by description or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs sm:text-sm bg-white dark:bg-slate-950"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {showGroupSelect && groups.length > 0 && (
          <div className="w-full sm:w-44">
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-full sm:w-36">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 px-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
