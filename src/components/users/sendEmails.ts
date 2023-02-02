import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
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
        const source = fs.readFileSync(path.join(__dirname, template), {
            encoding: 'utf8'
        });
        const compiledTemplate = handlebars.compile(source);
        const options = () => {
            return {
                from: config.hotmail.hotmailEmailSender,
                to: email,
                subject: subject,
                html: compiledTemplate(payload)
            };
        };
        transporter.sendMail(options(), (error) => {
            if (error) {
                sentMail = false;
                console.log(error);
                const criticalError = new Error(
                    `Error - could not send email due to: ${error}`
                );
                errorHandler.handleError(criticalError);
                return;
            }
        });
        sentMail = true;
        return sentMail;
    } catch (error) {
        const criticalError = new Error('Critical Error - Error sending email');
        errorHandler.handleError(criticalError);
    }
};

export default sendEmail;
