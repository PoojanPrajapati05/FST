"use client";
// 'use client' boundary required: SignInForm handles interactive user form inputs, client-side validation, and Better Auth browser signIn calls.

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, SignInFormValues } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import Link from "next/link";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: callbackUrl,
      });

      if (result.error) {
        toast.error(result.error.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back to SplitEase!");
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred during sign in.");
      setIsLoading(false);
    }
  };

  const fillQuickCredentials = (email: string, pass: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200/80 dark:border-slate-800/80">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your shared expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Lab Testing Helper Credentials */}
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <KeyRound className="h-3.5 w-3.5 text-blue-500" />
            <span>Lab Test Credentials (Click to fill):</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillQuickCredentials("admin@splitease.example.com", "Admin@123")}
              className="rounded bg-white px-2 py-1 text-slate-700 shadow-sm border hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              👑 Admin (Aarav)
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredentials("member1@example.com", "Member@123")}
              className="rounded bg-white px-2 py-1 text-slate-700 shadow-sm border hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
            >
              👤 Member 1 (Priya)
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
