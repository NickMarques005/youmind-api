//---mailService.js---//

const { sendMail } = require('../utils/mail');
const emailTemplates = require('../utils/mailTemplates');

const sendMultipleMails = ({ emails, subject, htmlTemplate }) => {

    const total_emails = Array.isArray(emails) ? emails.join(',') : emails

    const options = {
        from: process.env.MAIL_EMAIL,
        to: total_emails,
        subject: subject,
        html: htmlTemplate
    }
}

const sendIndividualMail = async ({ email, subject, htmlTemplate }) => {
    const options = {
        from: process.env.MAIL_EMAIL,
        to: email,
        subject: subject,
        html: htmlTemplate
    };

    await sendMail(options);
}

const mailServices = {
    sendVerificationEmail: async ({ userData, OTP }) => {
        const email = userData.email;
        const name = userData.name;
        const { subject, html } = emailTemplates.verifyAccount({ name, OTP });
        await sendIndividualMail({ email, name, subject, htmlTemplate: html });
    },
    welcomeEmail: async ({userData}) => {
        const email = userData.email;
        const name = userData.name;
        const { subject, html } = emailTemplates.welcomeUser({ name });
        await sendIndividualMail({ email, name, subject, htmlTemplate: html });
    },
    resetPasswordEmail: async ({ userData, resetLink }) => {
        const email = userData.email;
        const name = userData.name;
        const { subject, html } = emailTemplates.resetPassword({ name, resetLink });
        await sendIndividualMail({ email, name, subject, htmlTemplate: html });
    },
    passwordUpdatedEmail: async ({userData}) => {
        const email = userData.email;
        const name = userData.name;
        const { subject, html } = emailTemplates.passwordUpdated({ name });
        await sendIndividualMail({ email, name, subject, htmlTemplate: html });
    },
    updateAppEmail: async ({userData}) => {
        for (let i = 0; i < userData.emails.length; i++) {
            const email = userData.emails[i];
            const name = userData.names[i];
            const { subject, html } = emailTemplates.passwordUpdated({ name });
            await sendIndividualMail({ email, name, subject, htmlTemplate: html });
        }
    }
}

const sendMailService = async (type, options) => {
    if (mailServices[type]) {
        await mailServices[type](options);
    }
    else {
        throw new Error('Tipo de serviço de e-mail não definido');
    }
}

module.exports = { sendMailService };