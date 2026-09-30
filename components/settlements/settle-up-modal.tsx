"use client";
// 'use client' boundary required: SettleUpModal manages dialog state, settlement input form, and triggers atomic server settlement action.

import * as React from "react";
import { recordSettlementAction } from "@/app/actions/settlements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Handshake, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatPaiseToINR, SimplifiedTransaction } from "@/lib/settle";

interface SettleUpModalProps {
  groupId: string;
  currentUserId: string;
  members: { userId: string; name: string }[];
  suggestedDebts?: SimplifiedTransaction[];
  onSettled?: () => void;
}

export function SettleUpModal({
  groupId,
  currentUserId,
  members,
  suggestedDebts = [],
  onSettled,
}: SettleUpModalProps) {
  const [open, setOpen] = React.useState(false);
  const [receiverId, setReceiverId] = React.useState<string>("");
  const [amountRupees, setAmountRupees] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("Settling up balance");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter other members (cannot pay oneself)
  const payableMembers = members.filter((m) => m.userId !== currentUserId);

  // My debts to others
  const myDebts = suggestedDebts.filter((d) => d.fromUserId === currentUserId);

  const handleSelectSuggested = (debt: SimplifiedTransaction) => {
    setReceiverId(debt.toUserId);
    setAmountRupees((debt.amount / 100).toFixed(2));
    setNote(`Full settlement to ${debt.toUserName}`);
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId) {
      toast.error("Please select who you are paying.");
      return;
    }
    const parsedAmount = parseFloat(amountRupees);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than ₹0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordSettlementAction({
        groupId,
        receiverId,
        amountRupees: parsedAmount,
        note,
      });

      if (res.success) {
        toast.success("Settlement recorded successfully!");
        setOpen(false);
        setReceiverId("");
        setAmountRupees("");
        onSettled?.();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record settlement.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
          <Handshake className="mr-2 h-4 w-4" />
          Settle Up
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Handshake className="h-5 w-5 text-emerald-600" />
            <span>Record a Settlement</span>
          </DialogTitle>
          <DialogDescription>
            Record payments made in cash, UPI, or bank transfer to clear balances.
          </DialogDescription>
        </DialogHeader>

        {/* Suggested 1-click settlements */}
        {myDebts.length > 0 && (
          <div className="space-y-2 rounded-xl bg-emerald-50/80 p-3 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              ⚡ Recommended Simplification:
            </p>
            {myDebts.map((debt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 shadow-xs"
              >
                <span>
                  You owe <strong>{debt.toUserName}</strong>:{" "}
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatPaiseToINR(debt.amount)}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300"
                  onClick={() => handleSelectSuggested(debt)}
                >
                  Fill
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSettleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiver">Who are you paying?</Label>
            <Select value={receiverId} onValueChange={setReceiverId}>
              <SelectTrigger id="receiver">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {payableMembers.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settleAmount">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">₹</span>
              <Input
                id="settleAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-7 font-medium"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settleNote">Payment Note (Optional)</Label>
            <Input
              id="settleNote"
              placeholder="e.g. Sent via Google Pay UPI"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting || !receiverId || !amountRupees}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
