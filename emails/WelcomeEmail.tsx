import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  appUrl?: string;
}

export function WelcomeEmail({
  name = "Friend",
  appUrl = "http://localhost:3000",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SplitEase — Split expenses easily with roommates and friends</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Welcome to SplitEase 🎉</Heading>
          <Text style={subtitle}>Expense sharing, simplified</Text>
          <Hr style={hr} />

          <Section style={card}>
            <Text style={paragraph}>Hi {name},</Text>
            <Text style={paragraph}>
              Welcome aboard! SplitEase makes sharing expenses with friends, roommates, and travel groups effortless:
            </Text>

            <Section style={listBox}>
              <Text style={listItem}>✨ <strong>Real-time group splits</strong>: Equal, exact, or percentage-based.</Text>
              <Text style={listItem}>⚡ <strong>Debt Simplification</strong>: Proprietary greedy solver minimizes the number of transfers.</Text>
              <Text style={listItem}>🔒 <strong>Role-Based Access</strong>: Secure collaborative groups and full audit trails.</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/dashboard`}>
                Go to SplitEase Dashboard
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            SplitEase — The modern expense tracker.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f7",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  padding: "20px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px",
};

const heading: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "26px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
  textAlign: "center",
};

const subtitle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0 20px 0",
  textAlign: "center",
};

const hr: React.CSSProperties = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
};

const paragraph: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const listBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
};

const listItem: React.CSSProperties = {
  color: "#1e293b",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px 0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0 12px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "18px",
  textAlign: "center",
  margin: "0",
};
