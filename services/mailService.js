const nodemailer = require('nodemailer');
const emailjs = require('@emailjs/nodejs');

const transportEmail = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            user: 'youmind.oficial@gmail.com',
            pass: 'DnimUoy@135797531@'
        }
    })
};

exports.emailInit = () => {
    
}

exports.sendEmail = async () => {

    try {

        const transporter = transportEmail();

        const messageStructure = `<p>Hello Nicolas,</p>
        <p>You got a new message from YouMind:</p>
        <p style="padding: 12px; border-left: 4px solid #d0d0d0; font-style: italic;">How are you doing today? ;)</p>
        <p>Best wishes,<br>YouMind team</p>`

        const info = await transporter.sendMail({
            from: 'YouMind <youmind.oficial@gmail.com>',
            to: 'nicolas.marques005@gmail.com',
            subject: 'TESTING',
            html: messageStructure,
        });

        console.log('Message sent: ', info.messageId, '\nMessage: ', info.response);
        console.log(info.accepted ? info.accepted : info.rejected);
    }
    catch (err) {
        console.log("Erro ao enviar email: ", err);
    }

}
