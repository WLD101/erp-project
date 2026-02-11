import * as React from 'react';
import { Html, Body, Container, Text, Link, Preview, Heading } from '@react-email/components';

interface WelcomeEmailProps {
    firstName: string;
    loginUrl: string;
}

export const WelcomeEmail = ({ firstName, loginUrl }: WelcomeEmailProps) => (
    <Html>
        <Preview>Welcome to Enterprise ERP</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Welcome, {firstName}!</Heading>
                <Text style={text}>
                    You have been invited to join the Enterprise ERP system.
                </Text>
                <Link href={loginUrl} style={button}>
                    Get Started
                </Link>
                <Text style={text}>
                    If you didn't request this email, you can safely ignore it.
                </Text>
            </Container>
        </Body>
    </Html>
);

// Styles
const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '48px',
};

const text = {
    fontSize: '16px',
    lineHeight: '26px',
};

const button = {
    backgroundColor: '#007ee6',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px',
    marginTop: '20px',
};
