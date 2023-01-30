import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { send } from 'process';
import { Response } from 'express';
import { AppError, errorHandler } from '../../library/errorHandler';
import config from '../../config/config';
import { OAuth2Client } from 'google-auth-library';
//const { google } = require('googleapis');

// const client = new google.auth.OAuth2Client(
//     config.google.googleEmailClientID,
//     config.google.googleEmailClientSecret,
//     config.google.googleEmailRedirectURI
// );
// client.setCredentials({ refresh_token: config.google.googleEmailRefreshToken });

const sendEmail = async (
    email: string,
    subject: string,
    payload: unknown,
    template: string
) => {
    try {
        let sentMail: boolean | undefined;
        console.log('before CAT');
        //const clientAccessToken = await client.getAccessToken();
        //console.log(clientAccessToken);
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            //secure: true,
            auth: {
                // type: 'OAuth2',
                user: `${config.google.googleEmailSender}`,
                pass: `${config.google.googleEmailSenderPassword}`
                // clientId: config.google.googleEmailClientID,
                // clientSecret: config.google.googleEmailClientSecret,
                // refreshToken: config.google.googleEmailRefreshToken,
                // accessToken: String(clientAccessToken)
            }
        });
        console.log('sendEmails-before compiling email');
        const source = fs.readFileSync(path.join(__dirname, template), {
            encoding: 'utf8'
        });
        console.log('sendEmails-before compiling email#2');
        const compiledTemplate = handlebars.compile(source);
        console.log('sendEmails-before compiling email#3');
        const options = () => {
            return {
                from: config.google.googleEmailSender,
                to: email,
                subject: subject,
                html: compiledTemplate(payload)
            };
        };
        console.log('sendEmails-after compiling email and before sending');
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
        console.log('sendEmails - after successfully sending email');
        return sentMail;
    } catch (error) {
        const criticalError = new Error('Critical Error - Error sending email');
        errorHandler.handleError(criticalError);
    }
};

export default sendEmail;
