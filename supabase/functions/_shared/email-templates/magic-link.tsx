/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
  bodyIntro?: string
  bodyOutro?: string
  ctaLabel?: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
  bodyIntro,
  bodyOutro,
  ctaLabel,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          {bodyIntro ||
            `Click the button below to log in to ${siteName}. This link will expire shortly.`}
        </Text>
        <Button style={button} href={confirmationUrl}>
          {ctaLabel || 'Log In'}
        </Button>
        <Text style={footer}>
          {bodyOutro || "If you didn't request this link, you can safely ignore this email."}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const button = {
  backgroundColor: '#6366f1',
  backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
