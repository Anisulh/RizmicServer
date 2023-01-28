import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { send } from 'process';
import { Response } from 'express';
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
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.googleEmailSender,
                pass: config.googleEmailSenderPassword
            }
        });

        const source = fs.readFileSync(path.join(__dirname, template), 'utf8');
        const compiledTemplate = handlebars.compile(source);
        const options = () => {
            return {
                from: config.googleEmailSender,
                to: email,
                subject: subject,
                html: compiledTemplate(payload)
            };
        };

        transporter.sendMail(options(), (error) => {
            if (error) {
                sentMail = false;
                const error = new Error('Error sending email');
                errorHandler.handleError(error);
            } else {
                sentMail = true;
            }
        });
        return sentMail;
    } catch (error) {
        const criticalError = new Error('Error sending email');
        errorHandler.handleError(criticalError);
    }
};

export default sendEmail;
