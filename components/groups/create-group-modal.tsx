"use client";
// 'use client' boundary required: CreateGroupModal handles interactive modal inputs, member tag additions, and triggers createGroupAction.

import * as React from "react";
import { createGroupAction } from "@/app/actions/groups";
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
import { Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateGroupModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [memberEmailInput, setMemberEmailInput] = React.useState("");
  const [memberEmails, setMemberEmails] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddEmail = () => {
    const trimmed = memberEmailInput.trim().toLowerCase();
    if (trimmed && trimmed.includes("@") && !memberEmails.includes(trimmed)) {
      setMemberEmails([...memberEmails, trimmed]);
      setMemberEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setMemberEmails(memberEmails.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2) {
      toast.error("Group name must be at least 2 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGroupAction({
        name,
        description,
        memberEmails,
      });

      if (res.success) {
        toast.success(`Group "${name}" created successfully!`);
        setOpen(false);
        setName("");
        setDescription("");
        setMemberEmails([]);
        router.push(`/groups/${res.groupId}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create group.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Create New Expense Group</span>
          </DialogTitle>
          <DialogDescription>
            Organize a trip, flatmates, or an event with friends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="e.g. Manali Trip 2026, Koramangala 3BHK"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="groupDesc">Description (Optional)</Label>
            <Input
              id="groupDesc"
              placeholder="Short note about the group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="memberEmail">Invite Members by Email</Label>
            <div className="flex gap-2">
              <Input
                id="memberEmail"
                type="email"
                placeholder="friend@example.com"
                value={memberEmailInput}
                onChange={(e) => setMemberEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddEmail}>
                Add
              </Button>
            </div>
            {memberEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {memberEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="hover:text-red-500 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
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
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Group"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
