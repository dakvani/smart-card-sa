/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface FailureProps {
  userEmail?: string
  username?: string
  userId?: string
  errorMessage?: string
  attempts?: number
  adminUrl?: string
}

const Failure = ({
  userEmail,
  username,
  userId,
  errorMessage,
  attempts,
  adminUrl,
}: FailureProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome email delivery failed for {userEmail || 'a user'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ Welcome email failed</Heading>
        <Text style={text}>
          The welcome email could not be delivered after{' '}
          <strong>{attempts ?? 3} attempts</strong> and has been recorded for
          admin review.
        </Text>

        <Section style={card}>
          <Row label="User" value={username ? `@${username}` : '—'} />
          <Row label="Email" value={userEmail || '—'} />
          <Row label="User ID" value={userId || '—'} />
          <Row label="Attempts" value={String(attempts ?? 3)} />
          <Row label="Last error" value={errorMessage || 'Unknown error'} />
        </Section>

        {adminUrl ? (
          <Text style={text}>
            Open the{' '}
            <a href={adminUrl} style={link}>
              admin Emails dashboard
            </a>{' '}
            to retry or investigate.
          </Text>
        ) : null}

        <Text style={muted}>
          This alert is sent automatically by SmartCard when welcome emails
          exhaust their retry budget.
        </Text>
      </Container>
    </Body>
  </Html>
)

const Row = ({ label, value }: { label: string; value: string }) => (
  <Section style={{ marginBottom: 6 }}>
    <Text style={rowLabel}>{label}</Text>
    <Text style={rowValue}>{value}</Text>
  </Section>
)

// Resolve admin email at module load. Falls back to a placeholder so the
// registry import doesn't crash if the secret is missing — the send path
// still validates a real recipient.
const ADMIN_EMAIL = (globalThis as any).Deno?.env?.get?.('ADMIN_ALERT_EMAIL') || ''

export const template = {
  component: Failure,
  subject: (data: Record<string, any>) =>
    `[SmartCard] Welcome email failed for ${data.userEmail || data.username || 'user'}`,
  displayName: 'Welcome Email Failure Alert',
  previewData: {
    userEmail: 'user@example.com',
    username: 'demo',
    userId: 'abc-123',
    errorMessage: 'Provider returned 500',
    attempts: 3,
    adminUrl: 'https://www.smartcardsa.shop/admin',
  },
  to: ADMIN_EMAIL || undefined,
} satisfies TemplateEntry

// styles
const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: 560, margin: '0 auto' }
const h1 = { fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }
const text = { fontSize: 14, color: '#334155', lineHeight: '22px' }
const muted = { fontSize: 12, color: '#94a3b8', marginTop: 24 }
const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '14px 16px',
  margin: '12px 0 16px',
}
const rowLabel = {
  fontSize: 11,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.4,
  color: '#64748b',
  margin: 0,
}
const rowValue = {
  fontSize: 13,
  color: '#0f172a',
  margin: '2px 0 0',
  wordBreak: 'break-all' as const,
}
const link = { color: '#4f46e5', textDecoration: 'underline' }
