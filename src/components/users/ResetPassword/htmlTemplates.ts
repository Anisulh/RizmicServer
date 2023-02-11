export const forgotPasswordTemplate = (name: string, link: string) => {
    return `<h1>Rizmic</h1>
<p>Hi ${name},</p>
<p>You requested to reset your password.</p>
<p> Please, click the link below to reset your password</p>
<a href="https://${link}}">Reset Password</a>
<p></p>
<p style="font-size: 12px">This email is a no-response, please do not respond, there will be no response.</p>`;
};

export const resetPasswordTemplate = (name: any) => {
    return `<h1>Rizmic</h1>
    <p>Hi ${name},</p>
    <p>Great news!</p>
    <p>Your password has been changed successfully!</p>
    <p></p>
    <p style="font-size: 12px">This email is a no-response, please do not respond, there will be no response.</p>`;
};
