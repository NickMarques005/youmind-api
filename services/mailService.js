const nodemailer = require('nodemailer');
const { SettingOAuthClient } = require('../utils/oauth');

const createTransporterEmail = async () => {

    const ClientParams = {
        clientId: process.env.MAIL_CLIENT_ID,
        clientSecret: process.env.MAIL_CLIENT_SECRET,
        uri: process.env.MAIL_URI,
        refreshToken: process.env.MAIL_REFRESH_TOKEN
    }

    const OAuthAccessToken = await SettingOAuthClient(ClientParams);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: "OAuth2",
            user:process.env.MAIL_EMAIL,
            accessToken: OAuthAccessToken,
            clientId: process.env.MAIL_CLIENT_ID,
            clientSecret: process.env.MAIL_CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    });

    return transporter;
};

const mailTemplate = async (emails, message) => {

    const mailTemplate = {
        from: {
            name: 'YouMind',
            address: process.env.MAIL_EMAIL
        },
        to: emails,
        subject: 'HELLO WORLD',
        html: message,
    }

    return mailTemplate
}

const sendMail = async (emails, message) => {

    try {
        let transporter = await createTransporterEmail();
        const mailOptions = await mailTemplate(emails, message);

        let info = await transporter.sendMail(mailOptions);

        console.log('Mensagem enviada: ', info.messageId, '\nMessage: ', info.response);
        console.log(info.accepted ? info.accepted : info.rejected);
    }
    catch (err) {
        console.log("Erro ao enviar E-MAIL: ", err);
    }
}

module.exports = { sendMail };
