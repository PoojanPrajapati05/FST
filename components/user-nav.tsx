"use client";
// 'use client' boundary required: UserNav handles client-side sign-out action and user dropdown menu interactivity.

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { LogOut, User, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface UserNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error("Error signing out");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10 border border-slate-300 dark:border-slate-700">
            <AvatarFallback className="bg-blue-600 text-white font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">{user.name}</p>
          <p className="text-xs leading-none text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          {user.role === "ADMIN" && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Admin Privileges</span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Console</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 dark:text-red-400 cursor-pointer flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
