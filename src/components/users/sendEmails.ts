import nodemailer from 'nodemailer';
import { AppError, errorHandler } from '../../library/errorHandler';
import config from '../../config/config';

const sendEmail = async (
    email: string,
    subject: string,
    payload: unknown,
    template: string
) => {
    try {
        let sentMail: boolean | undefined;
        let transporter = nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            secure: false,
            requireTLS: true,
            port: 587,
            tls: {
                rejectUnauthorized: false
            },
            auth: {
                user: config.hotmail.hotmailEmailSender,
                pass: config.hotmail.hotmailPassword
            }
        });
        const options = () => {
            return {
                from: config.hotmail.hotmailEmailSender,
                to: email,
                subject: subject,
                html: template
            };
        };
        transporter.sendMail(options(), (error) => {
            if (error) {
               throw error
            }
        });
    } catch (error) {
        throw error
    }
};

export default sendEmail;
