"use client";
// 'use client' boundary required: ThemeToggle consumes client theme state and mounts interactive dropdown without SSR hydration flash.

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useMounted } from "@/lib/use-mounted";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  // Hydration guard using useSyncExternalStore
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9 opacity-50" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Toggle theme">
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-blue-400" />
          ) : theme === "system" ? (
            <Laptop className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-blue-400" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
          <Laptop className="h-4 w-4 text-slate-500" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
