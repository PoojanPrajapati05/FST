import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Signature verification (Svix / Resend Webhook Protocol)
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (webhookSecret && !webhookSecret.includes("placeholder")) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
          { error: "Missing required signature headers" },
          { status: 401 }
        );
      }

      // Verify HMAC sha256 signature
      try {
        const secretBytes = webhookSecret.startsWith("whsec_")
          ? Buffer.from(webhookSecret.slice(6), "base64")
          : Buffer.from(webhookSecret, "utf-8");

        const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
        const computedSignature = crypto
          .createHmac("sha256", secretBytes)
          .update(signedContent)
          .digest("base64");

        const passedSignatures = svixSignature.split(" ");
        const isValid = passedSignatures.some((sig) => {
          const parts = sig.split(",");
          const v1Sig = parts.find((p) => p.startsWith("v1,"))?.slice(3) || parts[0];
          return crypto.timingSafeEqual(
            Buffer.from(computedSignature),
            Buffer.from(v1Sig)
          );
        });

        if (!isValid) {
          console.warn("[Webhook Warning] Invalid Svix signature received");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      } catch (err) {
        console.error("[Webhook Error] Signature verification exception:", err);
        return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type || "email.unknown";
    const data = payload.data || {};

    const recipient =
      (Array.isArray(data.to) ? data.to[0] : data.to) ||
      data.recipient ||
      data.email ||
      "unknown@example.com";

    const subject = data.subject || "Notification";
    const resendId = data.email_id || data.id || null;
    const timestamp = data.created_at ? new Date(data.created_at) : new Date();

    // Persist into EmailEvent
    const emailEvent = await prisma.emailEvent.create({
      data: {
        type: eventType,
        recipient: String(recipient),
        subject: String(subject),
        resendId: resendId ? String(resendId) : null,
        metadata: data ? JSON.parse(JSON.stringify(data)) : undefined,
        timestamp,
      },
    });

    console.log(`[Resend Webhook Ingested] Type: ${eventType} | ID: ${emailEvent.id} | ResendId: ${resendId}`);

    return NextResponse.json({ received: true, id: emailEvent.id });
  } catch (error) {
    console.error("[Resend Webhook Handler Error]", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
