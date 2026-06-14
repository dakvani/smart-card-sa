/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface WelcomeProps {
  name?: string
  siteUrl?: string
  helpText?: string
  supportEmail?: string
  marketingUnsubscribeUrl?: string
  footerVersion?: number
}

const SITE_NAME = 'SmartCard'
const DEFAULT_URL = 'https://www.smartcardsa.shop'
const DEFAULT_SUPPORT = 'info@smartcardsa.shop'
const DEFAULT_HELP = `Need help? Reach us at ${DEFAULT_SUPPORT} — we read every message.`

const Welcome = ({
  name,
  siteUrl = DEFAULT_URL,
  helpText = DEFAULT_HELP,
  supportEmail = DEFAULT_SUPPORT,
  marketingUnsubscribeUrl,
}: WelcomeProps) => {
  const greeting = name && name.trim().length > 0 ? `Hey ${name},` : 'Hey there,'
  const dashboardUrl = `${siteUrl}/dashboard`

  // Render help text with the support email as a linkified mailto.
  const renderHelp = () => {
    if (supportEmail && helpText.includes(supportEmail)) {
      const [before, after] = helpText.split(supportEmail)
      return (
        <>
          {before}
          <Link href={`mailto:${supportEmail}`} style={link}>{supportEmail}</Link>
          {after}
        </>
      )
    }
    return helpText
  }

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to {SITE_NAME} — your digital identity starts here.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandRow}>
            <Heading style={brand}>{SITE_NAME}</Heading>
          </Section>
          <Heading style={h1}>Welcome aboard 👋</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            Thanks for signing up for <strong>{SITE_NAME}</strong>. Your account is ready —
            you can now build your digital profile, customize your smart link page, and order
            your own NFC SmartCard.
          </Text>
          <Section style={ctaWrap}>
            <Button style={button} href={dashboardUrl}>
              Open your dashboard
            </Button>
          </Section>
          <Text style={text}>A few things you can try right away:</Text>
          <Text style={list}>
            • Personalize your profile theme & links<br />
            • Add your social handles and contact info<br />
            • Browse NFC cards in our shop
          </Text>
          <Text style={footer}>
            {renderHelp()}<br />
            <Link href={siteUrl} style={link}>{siteUrl.replace(/^https?:\/\//, '')}</Link>
          </Text>
          {marketingUnsubscribeUrl && (
            <Text style={prefsFooter}>
              Don't want promotional emails from us?{' '}
              <Link href={marketingUnsubscribeUrl} style={mutedLink}>
                Unsubscribe from marketing
              </Link>
              . You'll still receive important account emails.
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Welcome,
  subject: `Welcome to ${SITE_NAME} 🎉`,
  displayName: 'Welcome email',
  previewData: {
    name: 'Alex',
    siteUrl: DEFAULT_URL,
    helpText: DEFAULT_HELP,
    supportEmail: DEFAULT_SUPPORT,
    marketingUnsubscribeUrl: `${DEFAULT_URL}/marketing-unsubscribe?token=preview`,
    footerVersion: 1,
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandRow = { marginBottom: '24px' }
const brand = {
  fontSize: '18px',
  fontWeight: 700 as const,
  color: 'hsl(270, 60%, 55%)',
  margin: 0,
  letterSpacing: '-0.01em',
}
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  color: '#0f0f17',
  margin: '0 0 16px',
  letterSpacing: '-0.02em',
}
const text = { fontSize: '15px', color: '#3f3f4d', lineHeight: '1.6', margin: '0 0 16px' }
const list = { fontSize: '15px', color: '#3f3f4d', lineHeight: '1.9', margin: '0 0 24px' }
const ctaWrap = { margin: '28px 0' }
const button = {
  backgroundImage: 'linear-gradient(135deg, hsl(270, 60%, 55%) 0%, hsl(330, 75%, 60%) 100%)',
  backgroundColor: 'hsl(270, 60%, 55%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '13px 26px',
  textDecoration: 'none',
  display: 'inline-block',
}
const link = { color: 'hsl(270, 60%, 55%)', textDecoration: 'underline' }
const mutedLink = { color: '#8a8a98', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#8a8a98', margin: '32px 0 0', lineHeight: '1.6' }
const prefsFooter = { fontSize: '11px', color: '#a1a1ad', margin: '16px 0 0', lineHeight: '1.6' }
