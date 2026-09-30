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

interface ExpenseAddedEmailProps {
  payerName: string;
  groupName: string;
  description: string;
  totalAmountRupees: string;
  userShareRupees: string;
  groupId: string;
  appUrl?: string;
}

export function ExpenseAddedEmail({
  payerName = "Alex",
  groupName = "Goa Trip 2026",
  description = "Beach Shack Dinner",
  totalAmountRupees = "₹2,400.00",
  userShareRupees = "₹600.00",
  groupId = "demo",
  appUrl = "http://localhost:3000",
}: ExpenseAddedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`${payerName} added "${description}" to ${groupName}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>SplitEase</Heading>
          <Text style={subtitle}>Shared expense update</Text>
          <Hr style={hr} />

          <Section style={card}>
            <Heading as="h2" style={cardTitle}>
              New Expense in {groupName}
            </Heading>
            <Text style={paragraph}>
              <strong>{payerName}</strong> added an expense:
            </Text>
            <Section style={highlightBox}>
              <Text style={expenseTitle}>{description}</Text>
              <Text style={amountText}>Total: {totalAmountRupees}</Text>
              <Text style={shareText}>Your share: {userShareRupees}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/groups/${groupId}`}>
                View in SplitEase
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            SplitEase — The effortless shared expense tracker for roommates, friends, and trips.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ExpenseAddedEmail;

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

const cardTitle: React.CSSProperties = {
  color: "#1e293b",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const paragraph: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const highlightBox: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
};

const expenseTitle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 8px 0",
};

const amountText: React.CSSProperties = {
  color: "#475569",
  fontSize: "14px",
  margin: "0 0 4px 0",
};

const shareText: React.CSSProperties = {
  color: "#16a34a",
  fontSize: "16px",
  fontWeight: "700",
  margin: "4px 0 0 0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0 12px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#2563eb",
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
