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
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  bodyIntro?: string
  bodyOutro?: string
  ctaLabel?: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
  bodyIntro,
  bodyOutro,
  ctaLabel,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been invited</Heading>
        {bodyIntro ? (
          <Text style={text}>{bodyIntro}</Text>
        ) : (
          <Text style={text}>
            You've been invited to join{' '}
            <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>
            . Click the button below to accept the invitation and create your account.
          </Text>
        )}
        <Button style={button} href={confirmationUrl}>
          {ctaLabel || 'Accept Invitation'}
        </Button>
        <Text style={footer}>
          {bodyOutro || "If you weren't expecting this invitation, you can safely ignore this email."}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#4f46e5',
  backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #1e1e5a 100%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
