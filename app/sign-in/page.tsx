import { Navbar } from "@/components/navbar";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Sign In — SplitEase",
  description: "Sign in to access your SplitEase groups and expenses.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <Suspense fallback={<Skeleton className="h-[420px] w-full max-w-md rounded-xl" />}>
          <SignInForm />
        </Suspense>
      </main>
    </div>
  );
}
