const getFirstName = (fullName) => {
    return fullName.split(' ')[0];
}

const templates = {
    resetPassword: ({ name, resetLink }) => {
        return {
            subject: "Redefição de Senha - YouMind",
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="background: linear-gradient(135deg, #9C27B0, #673AB7); padding: 10px; text-align: center;">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczNp8RUjBN3ncuBTO4kPAtPA0C9odwcOo7YkLCquMLD19DmbhvLzWxnmO7QUS9zK2yz874rnbnOrjUOci-fYc2UFFcdUPeam6R0WCQsl4pMcKjhz9cRpgGOCZa9swD3p5mBJnoLApvcNDdu28bBfTVU=w330-h318-s-no-gm?authuser=5" style="height: 100px; width: 100px; border-radius: 50%;">
                </div>
                <div style="padding: 20px;">
                    <p>Olá, ${getFirstName(name)},</p>
                    <p>Você solicitou a redefinição da sua senha. Por favor, clique no link abaixo para definir uma nova senha:</p>
                    <a href=${resetLink} style="display: inline-block; background-color: #673AB7; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
                </div>
            </div>
            `
        }
    },
    verifyAccount: ({ name, OTP, type }) => {
        return {
            subject: `Bem-vindo(a) à YouMind - Verifique seu endereço de e-mail`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="background: linear-gradient(135deg, #9C27B0, #673AB7); padding: 10px; text-align: center;">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczNp8RUjBN3ncuBTO4kPAtPA0C9odwcOo7YkLCquMLD19DmbhvLzWxnmO7QUS9zK2yz874rnbnOrjUOci-fYc2UFFcdUPeam6R0WCQsl4pMcKjhz9cRpgGOCZa9swD3p5mBJnoLApvcNDdu28bBfTVU=w330-h318-s-no-gm?authuser=5" style="height: 100px; width: 100px; border-radius: 50%;">
                </div>
                <div style="padding: 20px;">
                <div>
                <h1 style="color: #673AB7;">Olá, ${getFirstName(name)}</h1>
            </div>
            <div>
                <p>Queremos estender nossas mais calorosas boas-vindas por se juntar à família YouMind! 🙂</p>
                ${type === 'patient' ?
                    '<p>Obrigado por se registrar e dar o primeiro passo em direção a uma jornada de bem-estar e saúde mental. Por favor, digite o código a seguir em seu aplicativo YouMind para validar a sua conta:</p>'
                    : '<p>Acreditamos profundamente no poder da colaboração profissional para promover o bem-estar mental. Para começar a usar a plataforma e acessar nossas ferramentas especializadas, por favor, valide sua conta digitando o código a seguir em seu aplicativo YouMind:</p>'}
                <br>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="background-color: #F0F0F0; border-radius: 5px; font-size: 35px; padding: 10px 20px; font-weight: bold; letter-spacing: 3px;">${OTP}</span>
                </div>
            </div>
                </div>
            </div>
            `
        }
    },
    renewOTP: ({ name, OTP }) => {
        return {
            subject: "Renovação de PIN - YouMind",
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="background: linear-gradient(135deg, #9C27B0, #673AB7); padding: 10px; text-align: center;">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczNp8RUjBN3ncuBTO4kPAtPA0C9odwcOo7YkLCquMLD19DmbhvLzWxnmO7QUS9zK2yz874rnbnOrjUOci-fYc2UFFcdUPeam6R0WCQsl4pMcKjhz9cRpgGOCZa9swD3p5mBJnoLApvcNDdu28bBfTVU=w330-h318-s-no-gm?authuser=5" style="height: 100px; width: 100px; border-radius: 50%;">
                </div>
                <div style="padding: 20px;">
                    <h1 style="color: #673AB7;">Olá, ${getFirstName(name)}</h1>
                    <p>Estamos enviando este e-mail como parte do processo de segurança para renovação do seu PIN. Por favor, digite o código a seguir em seu aplicativo YouMind para renovar seu PIN e continuar acessando sua conta com segurança:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <span style="background-color: #F0F0F0; border-radius: 5px; font-size: 35px; padding: 10px 20px; font-weight: bold; letter-spacing: 3px;">${OTP}</span>
                    </div>
                    <p>Se você não solicitou a renovação do PIN, por favor, ignore este e-mail ou entre em contato conosco para garantir a segurança da sua conta.</p>
                    <p>Atenciosamente,</p>
                    <p>Equipe YouMind</p>
                </div>
            </div>
            `
        }
    },
    welcomeUser: ({ name }) => {
        return {
            subject: `Conta verificada com sucesso - YouMind ;)`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="background: linear-gradient(135deg, #9C27B0, #673AB7); padding: 10px; text-align: center;">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczNp8RUjBN3ncuBTO4kPAtPA0C9odwcOo7YkLCquMLD19DmbhvLzWxnmO7QUS9zK2yz874rnbnOrjUOci-fYc2UFFcdUPeam6R0WCQsl4pMcKjhz9cRpgGOCZa9swD3p5mBJnoLApvcNDdu28bBfTVU=w330-h318-s-no-gm?authuser=5" style="height: 100px; width: 100px; border-radius: 50%;">
                </div>
                <div style="padding: 20px;">
                    <p style="color: #673AB7;">Olá, ${getFirstName(name)}! Seja muito bem-vindo(a) ao YouMind!</p>
                    <div>
                        <p>Estamos verdadeiramente ansiosos para acompanhar e apoiar você em seu tratamento. Aqui na YouMind, acreditamos firmemente na importância de cuidar da mente e estamos aqui para oferecer recursos, apoio e orientação personalizados para atender às suas necessidades.</p>
                        <p>Se tiver qualquer dúvida ou precisar de assistência, sinta-se à vontade para entrar em contato conosco.</p>
                    </div>
                    <br>
                    <div>
                        <p>Atenciosamente,</p>
                        <p>Equipe YouMind</p>
                    </div>
                </div>
            </div>
            
            `,
        }
    },
    passwordUpdated: ({ name }) => {
        return {
            subject: `Sua senha foi atualizada com sucesso - YouMind ;)`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="background: linear-gradient(135deg, #9C27B0, #673AB7); padding: 10px; text-align: center;">
                    <img src="https://lh3.googleusercontent.com/pw/AP1GczNp8RUjBN3ncuBTO4kPAtPA0C9odwcOo7YkLCquMLD19DmbhvLzWxnmO7QUS9zK2yz874rnbnOrjUOci-fYc2UFFcdUPeam6R0WCQsl4pMcKjhz9cRpgGOCZa9swD3p5mBJnoLApvcNDdu28bBfTVU=w330-h318-s-no-gm?authuser=5" style="height: 100px; width: 100px; border-radius: 50%;">
                </div>
                <div style="padding: 20px;">
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h1 style="color: #673AB7;">Sua senha foi alterada!</h1>
                        <p>Olá, ${getFirstName(name)}!</p>
                        <p>Sua senha foi alterada com sucesso. Se você não realizou esta alteração, por favor entre em contato conosco imediatamente.</p>
                        <p>É importante manter a segurança da sua conta para proteger suas informações pessoais. Recomendamos que você não compartilhe sua senha com ninguém e que a altere regularmente.</p>
                        <p>Se precisar de ajuda, nossa equipe está sempre disponível para auxiliá-lo.</p>
                        <p>Atenciosamente,</p>
                        <p>Equipe YouMind</p>
                    </div>
                </div>
            </div>
                
            `,
        }
    },
    updateApp: ({ name }) => {
        return {
            subject: `Nova atualização disponível - YouMind `,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <div style="background: linear-gradient(135deg, #9C27B0, #673AB7); padding: 10px; text-align: center;">
                        <img src="https://lh3.googleusercontent.com/pw/AP1GczNp8RUjBN3ncuBTO4kPAtPA0C9odwcOo7YkLCquMLD19DmbhvLzWxnmO7QUS9zK2yz874rnbnOrjUOci-fYc2UFFcdUPeam6R0WCQsl4pMcKjhz9cRpgGOCZa9swD3p5mBJnoLApvcNDdu28bBfTVU=w330-h318-s-no-gm?authuser=5" style="height: 100px; width: 100px; border-radius: 50%;">
                    </div>
                    <div style="padding: 20px;">
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h1 style="color: #673AB7;">Nova atualização YouMind disponível!</h1>
                            <p>Olá, ${getFirstName(name)},</p>
                            <p>Houve uma nova atualização em nosso aplicativo!</p>
                            <p>Por favor, atualize o app para a nova versão e mantenha seu tratamento sempre atualizado!</p>
                            <p>Atenciosamente,</p>
                            <p>Equipe YouMind</p>
                        </div>
                    </div>
                </div>
                
            `,
        }
    }
}

module.exports = templates;