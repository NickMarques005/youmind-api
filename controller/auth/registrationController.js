const bcrypt = require("bcryptjs");
const { getUserModel } = require("../../utils/model");
const { generateOTP } = require("../../utils/mail");
const { sendMailService } = require("../../services/mailService");
const { HandleError, HandleSuccess } = require("../../utils/handleResponse");
const verification_token = require('../../models/verification_token');
const { isValidObjectId } = require("mongoose");
const { formatTimeLeft } = require('../../utils/formatDate');
const MessageTypes = require("../../utils/typeResponse");

exports.registerUser = async (req, res) => {
    try {

        const { name, email, password, type, phone, doctor_crm } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let userModel = getUserModel(type);

        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const registered = await userModel.findOne({ email });
        if (registered) return HandleError(res, 400, "O usuário já está registrado");

        if (type === "doctor" && !doctor_crm) return HandleError(res, 400, "Registro CRM inválido");

        const OTP = generateOTP();

        console.log("OTP CRIADO: ", OTP);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            phone,
            type,
            ...(type === "doctor" && { doctor_crm }),
        });

        const verificationToken = new verification_token({
            owner: newUser._id,
            token: OTP,
        });

        await sendMailService("sendVerificationEmail", {
            userData: { email: email, name: name, type: type },
            OTP: OTP,
        })


        await newUser.save();
        await verificationToken.save();

        const registerData = {
            _id: newUser._id,
            type: newUser.type
        }

        return HandleSuccess(res, 200, "Sua conta foi criada com sucesso!", registerData, MessageTypes.SUCCESS);
    } catch (err) {
        console.error(`Erro ao criar usuário: ${err}`);
        return HandleError(res, 500, "Erro ao criar usuário");
    }
}

exports.renewOTP = async (req, res) => {
    try {
        const { userId, type } = req.body;

        if (!userId) return HandleError(res, 400, "Usuário não especificado");

        let userModel = getUserModel(type);

        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const user = await userModel.findById(userId);
        if (!user) return HandleError(res, 404, `Usuário não cadastrado`);

        if (user.verified) return HandleError(res, 400, "Usuário já está verificado!");

        let token = await verification_token.findOne({ owner: user._id });

        if (!token) {
            const newOTP = generateOTP();
            token = new verification_token({
                owner: user._id,
                token: newOTP,
                lastRenewedAt: new Date(),
                renewalCount: 0
            });
            await token.save();
        }

        const now = new Date();
        const timeElapsedSinceLastRenewal = now - token.lastRenewedAt; 
        const timeToWait = 1800000 - timeElapsedSinceLastRenewal;

        if (token.renewalCount >= 3 && timeToWait > 0) {
                const timeLeft = formatTimeLeft(timeToWait)
                return HandleError(res, 429, `Limite de solicitação para renovação de OTP excedido. Por favor, aguarde até poder solicitar novamente. Faltam ${timeLeft}.`);
        }

        const newOTP = generateOTP();
        token.token = newOTP;
        token.lastRenewedAt = now;
        token.renewalCount = token.renewalCount >= 3 ? 0 : token.renewalCount + 1;
        await token.save();

        await sendMailService("renewOTP", {
            userData: { email: user.email, name: user.name },
            OTP: newOTP,
        });

        return HandleSuccess(res, 200, "Um novo código foi enviado ao seu e-mail. Por favor, verifique também a caixa de spam.", undefined, MessageTypes.EMAIL_SENT);

    } catch (err) {
        console.error("Houve um erro interno no servidor: ", err);
        return HandleError(res, 500, "Erro ao renovar OTP");
    }
}

exports.verifyEmail = async (req, res) => {

    try {
        const { otp, userId, type } = req.body;

        if (!userId || !otp.trim()) return HandleError(res, 400, "Usuário ou OTP não especificado");

        if (!isValidObjectId(userId)) return HandleError(res, 400, "Usuário inválido");

        let userModel = getUserModel(type);

        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const user = await userModel.findById(userId);

        if (!user) return HandleError(res, 404, `Usuário não cadastrado`);

        if (user.verified) return HandleError(res, 400, "Essa conta já foi verificada! Por favor faça seu login");

        const tokenOtp = await verification_token.findOne({ owner: user._id });
        if (!tokenOtp) return HandleError(res, 404, "Token do código não encontrado ou expirou");

        const isMatched = await tokenOtp.compareToken(otp);
        if (!isMatched) return HandleError(res, 400, "Por favor, entre com um token válido!");

        user.verified = true;

        await verification_token.findByIdAndDelete(tokenOtp._id);
        await user.save();

        await sendMailService("welcomeEmail", {
            userData: { email: user.email, name: user.name },
        });

        return HandleSuccess(res, 200, "Sua conta foi verificada com sucesso!", undefined, MessageTypes.SUCCESS);
    }
    catch (err) {
        console.error("Houve um erro interno no servidor: ", err);
        return HandleError(res, 500, "Erro ao verificar conta");
    }

}