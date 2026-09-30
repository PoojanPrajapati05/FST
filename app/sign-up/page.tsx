import { Navbar } from "@/components/navbar";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Create Account — SplitEase",
  description: "Join SplitEase to split expenses seamlessly with friends and roommates.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Suspense fallback={<Skeleton className="h-[480px] w-full max-w-md rounded-xl" />}>
          <SignUpForm />
        </Suspense>
      </main>
    </div>
  );
}
