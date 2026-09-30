import { z } from "zod";

// ---- Transaction Schemas ----

export const transactionSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  type: z.enum(["CREDIT", "DEBIT", "TRANSFER"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REVERSED"]).default("PENDING"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().trim().min(2, "Description must be at least 2 chars").max(200),
  reference: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

// ---- Support Request Schemas ----

export const supportRequestSchema = z.object({
  subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(100),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export type SupportRequestInput = z.infer<typeof supportRequestSchema>;

// ---- Contact / General Form (used on Assignment 1 page) ----

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().email("Please enter a valid email address"),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(100),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(500),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
