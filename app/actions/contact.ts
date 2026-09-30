"use server";

import { contactFormSchema, type ContactFormValues } from "@/lib/validations/transaction";

export type ContactActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

/**
 * Server Action: Contact Form Submission
 * Demonstrates: "use server", Zod validation on server, same schema as client
 */
export async function submitContactAction(
  input: ContactFormValues
): Promise<ContactActionState> {
  // 1. Server-side Zod validation (same schema shared with client)
  const parsed = contactFormSchema.safeParse(input);

  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = errors[field] ? [...errors[field], issue.message] : [issue.message];
    }
    return { success: false, message: "Validation failed", errors };
  }

  // 2. Simulate async processing (e.g. sending to DB or email)
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 3. Simulate occasional server error (for demonstration)
  if (parsed.data.email.includes("error@")) {
    return {
      success: false,
      message: "Server error: Could not process your request. Please try again.",
    };
  }

  // 4. Success
  console.log("[Server Action] Contact form submitted:", {
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
  });

  return {
    success: true,
    message: `Thank you, ${parsed.data.name}! Your message has been received.`,
  };
}
