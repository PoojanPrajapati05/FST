"use client";
// 'use client' boundary required: AddExpenseModal contains interactive form state, Zustand draft persistence, dynamic split calculations, and client action dispatch.

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  expenseFormSchema,
  ExpenseFormValues,
  EXPENSE_CATEGORIES,
} from "@/lib/validations/expense";
import { addExpenseAction } from "@/app/actions/expenses";
import { useExpenseDraft } from "@/lib/store/expense-draft-store";
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
import { PlusCircle, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatPaiseToINR } from "@/lib/settle";

interface GroupMemberInfo {
  userId: string;
  name: string;
  email: string;
}

interface AddExpenseModalProps {
  groupId: string;
  currentUserId: string;
  members: GroupMemberInfo[];
  onExpenseAdded?: () => void;
}

export function AddExpenseModal({
  groupId,
  currentUserId,
  members,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Zustand persistent draft state
  const { draft, setDraft, clearDraft, isHydrated } = useExpenseDraft(groupId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as any,
    defaultValues: {
      groupId,
      description: "",
      amountRupees: undefined,
      category: "GENERAL",
      paidById: currentUserId,
      splitType: "EQUAL",
      participantUserIds: members.map((m) => m.userId),
      exactSharesRupees: {},
      percentShares: {},
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Watch form fields for live feedback & draft syncing
  const watchedSplitType = watch("splitType");
  const watchedAmountRupees = watch("amountRupees") || 0;
  const watchedParticipants = watch("participantUserIds") || [];
  const watchedExactShares = watch("exactSharesRupees") || {};
  const watchedPercentShares = watch("percentShares") || {};

  // Restore persisted Zustand draft when modal opens
  React.useEffect(() => {
    if (open && isHydrated && draft.description) {
      setValue("description", draft.description);
      if (draft.amountRupees) {
        setValue("amountRupees", Number(draft.amountRupees));
      }
      if (draft.category) setValue("category", draft.category as any);
      if (draft.paidById) setValue("paidById", draft.paidById);
      if (draft.splitType) setValue("splitType", draft.splitType);
      if (draft.participantUserIds?.length) {
        setValue("participantUserIds", draft.participantUserIds);
      }
      if (draft.exactSharesRupees) setValue("exactSharesRupees", draft.exactSharesRupees);
      if (draft.percentShares) setValue("percentShares", draft.percentShares);
    }
  }, [open, isHydrated, draft, setValue]);

  // Sync draft to Zustand as user types
  const handleFieldChange = (field: string, value: unknown) => {
    setDraft({ [field]: value } as any);
  };

  const onSubmit = async (values: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await addExpenseAction(values);
      if (res?.success) {
        toast.success(`Expense "${values.description}" added successfully!`);
        clearDraft();
        reset();
        setOpen(false);
        onExpenseAdded?.();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add expense. Please check your inputs.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Participant toggle helper
  const toggleParticipant = (userId: string) => {
    const current = [...watchedParticipants];
    const exists = current.includes(userId);
    const updated = exists ? current.filter((id) => id !== userId) : [...current, userId];
    setValue("participantUserIds", updated, { shouldValidate: true });
    setDraft({ participantUserIds: updated });
  };

  // Calculations for live preview
  const equalShareRupees =
    watchedParticipants.length > 0 && watchedAmountRupees > 0
      ? (watchedAmountRupees / watchedParticipants.length).toFixed(2)
      : "0.00";

  const exactSum = Object.entries(watchedExactShares)
    .filter(([uid]) => watchedParticipants.includes(uid))
    .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);

  const percentSum = Object.entries(watchedPercentShares)
    .filter(([uid]) => watchedParticipants.includes(uid))
    .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span>Add an Expense</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              Paise-Precision
            </span>
          </DialogTitle>
          <DialogDescription>
            Record a shared cost. SplitEase automatically handles balance adjustments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g. Dinner at Thalassa, Uber to Airport"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "desc-error" : undefined}
              {...register("description", {
                onChange: (e) => handleFieldChange("description", e.target.value),
              })}
            />
            {errors.description && (
              <p id="desc-error" className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amountRupees">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">₹</span>
                <Input
                  id="amountRupees"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-7 font-medium"
                  aria-invalid={!!errors.amountRupees}
                  aria-describedby={errors.amountRupees ? "amount-error" : undefined}
                  {...register("amountRupees", {
                    onChange: (e) => handleFieldChange("amountRupees", e.target.value),
                  })}
                />
              </div>
              {errors.amountRupees && (
                <p id="amount-error" className="text-xs text-red-500">
                  {errors.amountRupees.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                defaultValue="GENERAL"
                onValueChange={(val) => {
                  setValue("category", val as (typeof EXPENSE_CATEGORIES)[number]);
                  handleFieldChange("category", val);
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Paid By */}
          <div className="space-y-1.5">
            <Label htmlFor="paidById">Paid by</Label>
            <Select
              defaultValue={currentUserId}
              onValueChange={(val) => {
                setValue("paidById", val);
                handleFieldChange("paidById", val);
              }}
            >
              <SelectTrigger id="paidById">
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>
                    {m.name} {m.userId === currentUserId ? "(You)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split Type Selector */}
          <div className="space-y-1.5">
            <Label>Split Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["EQUAL", "EXACT", "PERCENT"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    setValue("splitType", type);
                    handleFieldChange("splitType", type);
                  }}
                  className={`rounded-lg py-2 text-xs font-semibold border transition-all ${
                    watchedSplitType === type
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  {type === "EQUAL" ? "Equal (=)" : type === "EXACT" ? "Exact (₹)" : "Percent (%)"}
                </button>
              ))}
            </div>
          </div>

          {/* Participants & Custom Shares Section */}
          <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Included Participants ({watchedParticipants.length})
              </Label>
              {watchedSplitType === "EQUAL" && watchedAmountRupees > 0 && (
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  ~₹{equalShareRupees} / person
                </span>
              )}
            </div>

            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
              {members.map((member) => {
                const isChecked = watchedParticipants.includes(member.userId);
                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleParticipant(member.userId)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        {member.name} {member.userId === currentUserId ? "(You)" : ""}
                      </span>
                    </label>

                    {/* Exact amount input */}
                    {watchedSplitType === "EXACT" && isChecked && (
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-semibold">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          className="h-8 pl-5 pr-2 text-xs font-semibold"
                          defaultValue={watchedExactShares[member.userId] || ""}
                          onChange={(e) => {
                            const updated = {
                              ...watchedExactShares,
                              [member.userId]: parseFloat(e.target.value) || 0,
                            };
                            setValue("exactSharesRupees", updated);
                            handleFieldChange("exactSharesRupees", updated);
                          }}
                        />
                      </div>
                    )}

                    {/* Percentage input */}
                    {watchedSplitType === "PERCENT" && isChecked && (
                      <div className="relative w-24">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="0"
                          className="h-8 pr-5 pl-2 text-xs font-semibold text-right"
                          defaultValue={watchedPercentShares[member.userId] || ""}
                          onChange={(e) => {
                            const updated = {
                              ...watchedPercentShares,
                              [member.userId]: parseFloat(e.target.value) || 0,
                            };
                            setValue("percentShares", updated);
                            handleFieldChange("percentShares", updated);
                          }}
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-semibold">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Split integrity check banner */}
            {watchedSplitType === "EXACT" && (
              <div
                className={`mt-2 flex items-center justify-between text-xs p-2 rounded-md ${
                  Math.abs(exactSum - watchedAmountRupees) < 0.01
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                <span>Allocated: ₹{exactSum.toFixed(2)}</span>
                <span>
                  Remaining: ₹{(watchedAmountRupees - exactSum).toFixed(2)}
                </span>
              </div>
            )}

            {watchedSplitType === "PERCENT" && (
              <div
                className={`mt-2 flex items-center justify-between text-xs p-2 rounded-md ${
                  Math.abs(percentSum - 100) < 0.05
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                <span>Total: {percentSum.toFixed(1)}%</span>
                <span>
                  {Math.abs(percentSum - 100) < 0.05 ? "✓ Valid 100%" : `Must equal 100% (Diff: ${(100 - percentSum).toFixed(1)}%)`}
                </span>
              </div>
            )}
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving & Re-validating...
                </>
              ) : (
                "Save Expense"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
