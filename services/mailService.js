const nodemailer = require('nodemailer');
const emailjs = require('@emailjs/nodejs');

const transportEmail = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_EMAIL,
            pass: process.env.MAIL_PASSWORD,
        }
    })
};

const mailTemplate = async (emails, message) => {

    const mailTemplate = {
        from: {
            name: 'YouMind',
            address: process.env.MAIL_EMAIL
        },
        to: emails,
        subject: 'HELLO WORLD',
        html: messagStructure,
    }

    return mailTemplate
}

exports.sendMail = async (emails, message) => {

    try {
        const transporter = transportEmail();
        const mailOptions = mailTemplate(emails, message);

        await transporter.sendMail(mailOptions);

        console.log('Message sent: ', info.messageId, '\nMessage: ', info.response);
        console.log(info.accepted ? info.accepted : info.rejected);
    }
    catch (err) {
        console.log("Erro ao enviar email: ", err);
    }
}

const emailExample = ['nicolas.marques005@gmail.com']

const messageStructure = `<p>Hello Nicolas,</p>
        <p>You got a new message from YouMind:</p>
        <p style="padding: 12px; border-left: 4px solid #d0d0d0; font-style: italic;">How are you doing today? ;)</p>
        <p>Best wishes,<br>YouMind team</p>`

//Send Mail Example:
sendMail(emailExample, messageStructure);
