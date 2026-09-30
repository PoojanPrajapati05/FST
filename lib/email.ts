import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import ExpenseAddedEmail from "@/emails/ExpenseAddedEmail";
import SettlementSummaryEmail from "@/emails/SettlementSummaryEmail";
import WelcomeEmail from "@/emails/WelcomeEmail";
import * as React from "react";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "SplitEase <notifications@resend.dev>";
const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

const resend = resendApiKey && !resendApiKey.includes("placeholder")
  ? new Resend(resendApiKey)
  : null;

interface SendEmailParams {
  to: string;
  subject: string;
  react: React.ReactElement;
  metadata?: Record<string, unknown>;
}

export async function sendEmail({ to, subject, react, metadata }: SendEmailParams): Promise<string | null> {
  try {
    let resendId: string | null = null;

    if (resend) {
      const response = await resend.emails.send({
        from: emailFrom,
        to,
        subject,
        react,
      });

      if (response.data?.id) {
        resendId = response.data.id;
      } else if (response.error) {
        console.warn("[Resend Warning] Failed to dispatch email:", response.error.message);
      }
    } else {
      // Mock / Dev mode fallback when placeholder API key is present
      resendId = `dev_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      console.log(`[Email Service - Simulated Send] To: ${to} | Subject: "${subject}" | ResendId: ${resendId}`);
    }

    // Persist EmailEvent in database for audit and webhook tracking
    await prisma.emailEvent.create({
      data: {
        type: "email.sent",
        recipient: to,
        subject,
        resendId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        timestamp: new Date(),
      },
    });

    return resendId;
  } catch (error) {
    // Non-blocking: email failures must NEVER rollback DB mutations
    console.error("[Email Service Error] Failed to send email or log event:", error);
    return null;
  }
}

/**
 * Send welcome email to a new user
 */
export async function sendWelcomeNotification(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: "Welcome to SplitEase! 🎉",
    react: React.createElement(WelcomeEmail, { name, appUrl }),
    metadata: { context: "USER_SIGNUP", email },
  });
}

/**
 * Send notification when an expense is added
 */
export async function sendExpenseNotification({
  to,
  payerName,
  groupName,
  description,
  totalAmountRupees,
  userShareRupees,
  groupId,
}: {
  to: string;
  payerName: string;
  groupName: string;
  description: string;
  totalAmountRupees: string;
  userShareRupees: string;
  groupId: string;
}) {
  return sendEmail({
    to,
    subject: `New expense in ${groupName}: ${description}`,
    react: React.createElement(ExpenseAddedEmail, {
      payerName,
      groupName,
      description,
      totalAmountRupees,
      userShareRupees,
      groupId,
      appUrl,
    }),
    metadata: { context: "EXPENSE_ADDED", groupId, description },
  });
}

/**
 * Send notification when a settlement is recorded
 */
export async function sendSettlementNotification({
  to,
  payerName,
  receiverName,
  groupName,
  amountRupees,
  note,
  groupId,
}: {
  to: string;
  payerName: string;
  receiverName: string;
  groupName: string;
  amountRupees: string;
  note?: string;
  groupId: string;
}) {
  return sendEmail({
    to,
    subject: `Debt settled in ${groupName}: ${amountRupees}`,
    react: React.createElement(SettlementSummaryEmail, {
      payerName,
      receiverName,
      groupName,
      amountRupees,
      note,
      groupId,
      appUrl,
    }),
    metadata: { context: "SETTLEMENT_RECORDED", groupId, amountRupees },
  });
}
