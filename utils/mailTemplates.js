
//---mailTemplates.js---//

const templates = {
    resetPassword: ({ name, resetLink }) => {
        return {
            subject: "Redefição de Senha - YouMind",
            html: `
            <p>Olá, ${name}</p>
            <p>Você solicitou a redefinição da sua senha. Por favor, clique no link abaixo para definir uma nova senha:</p>
            <a href="${resetLink}">Redefinir Senha</a>
            `
        }
    },
    verifyAccount: ({ name, OTP }) => {
        return {
            subject: `Bem-vindo(a) à YouMind - Verifique seu endereço de e-mail`,
            html: `
            <div>
                <h1>Olá, ${name}</h1>
            </div>
            <div>
                <p>Queremos estender nossas mais calorosas boas-vindas por se juntar à família YouMind! 🙂</p>
                <p>Obrigado por se registrar e dar o primeiro passo em direção a uma jornada de bem-estar e saúde mental. Por favor, digite o código a seguir em seu aplicativo YouMind para validar a sua conta:</p>
                <br>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="background-color: #F0F0F0; border-radius: 5px; font-size: 35px; padding: 10px 20px; font-weight: bold; letter-spacing: 3px;">${OTP}</span>
                </div>
            </div>
            `
        }
    },
    welcomeUser: (name) => {
        return {
            subject: `Conta verificada com sucesso - YouMind ;)`,
            html: `
            <p>Olá, ${name}! Seja muito bem-vindo(a) ao YouMind!</p>
            <div>
                <p>Estamos verdadeiramente ansiosos para acompanhar e apoiar você em seu tratamento. Aqui na YouMind, acreditamos firmemente na importância de cuidar da mente e estamos aqui para oferecer recursos, apoio e orientação personalizados para atender às suas necessidades.</p>
                <p>Se tiver qualquer dúvida ou precisar de assistência, sinta-se à vontade para entrar em contato conosco.</p>
            </div>
            <br>
            <div>
                <p>Atenciosamente,</p>
                <p>Equipe YouMind</p>
            </div>
            `,
        }
    },
    passwordUpdated: (name) => {
        return {
            subject: `Sua senha foi atualizada com sucesso - YouMind ;)`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #333;">Senha Alterada com Sucesso</h1>
                    <p>Olá, ${name},</p>
                    <p>Sua senha foi alterada com sucesso. Se você não realizou esta alteração, por favor entre em contato conosco imediatamente.</p>
                    <p>É importante manter a segurança da sua conta para proteger suas informações pessoais. Recomendamos que você não compartilhe sua senha com ninguém e que a altere regularmente.</p>
                    <p>Se precisar de ajuda, nossa equipe está sempre disponível para assisti-lo.</p>
                    <p>Atenciosamente,</p>
                    <p>Equipe YouMind</p>
                </div>
            `,
        }
    },
    updateApp: (name) => {
        return {
            subject: `Nova atualização disponível - YouMind `,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1 style="color: #333;">Senha Alterada com Sucesso</h1>
                    <p>Olá, ${name},</p>
                    <p>Houve uma nova atualização em nosso aplicativo!</p>
                    <p>Por favor, atualize o app para a nova versão e mantenha seu tratamento sempre atualizado!</p>
                    <p>Atenciosamente,</p>
                    <p>Equipe YouMind</p>
                </div>
            `,
        }
    }

}

module.exports = templates;