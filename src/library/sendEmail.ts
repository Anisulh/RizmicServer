import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from '../config/config';
import { createEmailOAuth2Client } from './googleOAuth';

const OAuth2 = google.auth.OAuth2;

class EmailService {
    private static instance: EmailService;
    private transporter: nodemailer.Transporter | null = null;

    private constructor() {}

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    public async init(): Promise<void> {
        if (!this.transporter) {
            const { accessToken } = await createEmailOAuth2Client();
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: config.google.googleEmailSender,
                    accessToken,
                    clientId: config.google.googleClientID,
                    clientSecret: config.google.googleEmailClientSecret,
                    refreshToken: config.google.googleEmailRefreshToken
                }
            });
        }
    }

    public async sendEmail(
        email: string,
        subject: string,
        htmlContent: string
    ): Promise<void> {
        if (!this.transporter) {
            throw new Error('Transporter is not initialized');
        }

        try {
            await this.transporter.sendMail({
                from: config.google.googleEmailSender,
                to: email,
                subject: subject,
                html: htmlContent
            });
        } catch (error) {
            console.error('Error sending email', error);
            throw error;
        }
    }
}

const emailService = EmailService.getInstance();

export default emailService;
