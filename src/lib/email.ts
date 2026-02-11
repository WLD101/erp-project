import { Resend } from 'resend';
import { logger } from './logger';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    text?: string;
}

export async function sendEmail({ to, subject, react, text }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        logger.warn('RESEND_API_KEY is not set. Email not sent.', { to, subject });
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to,
            subject,
            react,
            text, // Fallback text version
        });

        logger.info('Email sent successfully', { id: data.data?.id, to });
        return { success: true, data };
    } catch (error) {
        logger.error('Failed to send email', error, { to, subject });
        return { success: false, error };
    }
}
