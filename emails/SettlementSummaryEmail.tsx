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

interface SettlementSummaryEmailProps {
  payerName: string;
  receiverName: string;
  groupName: string;
  amountRupees: string;
  note?: string;
  groupId: string;
  appUrl?: string;
}

export function SettlementSummaryEmail({
  payerName = "Rohan",
  receiverName = "Priya",
  groupName = "Apartment 402",
  amountRupees = "₹1,250.00",
  note = "Settling up for electricity bill",
  groupId = "demo",
  appUrl = "http://localhost:3000",
}: SettlementSummaryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Settlement recorded: ${payerName} paid ${receiverName} ${amountRupees}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>SplitEase</Heading>
          <Text style={subtitle}>Settlement Recorded</Text>
          <Hr style={hr} />

          <Section style={card}>
            <Heading as="h2" style={cardTitle}>
              Debt Settled in {groupName}
            </Heading>
            <Text style={paragraph}>
              A payment has been officially recorded to settle up balances.
            </Text>

            <Section style={highlightBox}>
              <Text style={amountText}>
                <strong>Amount:</strong> {amountRupees}
              </Text>
              <Text style={paragraphDetail}>
                <strong>Payer:</strong> {payerName}
              </Text>
              <Text style={paragraphDetail}>
                <strong>Recipient:</strong> {receiverName}
              </Text>
              {note && (
                <Text style={noteDetail}>
                  <em>&ldquo;{note}&rdquo;</em>
                </Text>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={`${appUrl}/groups/${groupId}`}>
                View Updated Balances
              </Button>
            </Section>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            SplitEase — Automated debt simplification for stress-free splitting.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default SettlementSummaryEmail;

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
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
};

const amountText: React.CSSProperties = {
  color: "#15803d",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const paragraphDetail: React.CSSProperties = {
  color: "#334155",
  fontSize: "14px",
  margin: "0 0 6px 0",
};

const noteDetail: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  margin: "8px 0 0 0",
};

const buttonContainer: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0 12px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#16a34a",
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
