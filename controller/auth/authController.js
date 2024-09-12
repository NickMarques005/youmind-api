const { getUserModel } = require("../../utils/db/model");
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const { removeTokenOnFirebase, getTokenFromFirebase } = require("../../firebase/push_notification/push_notification");
const { MessageTypes } = require("../../utils/response/typeResponse");
const { DoctorUser, PatientUser } = require("../../models/users");

exports.authenticateUser = async (req, res) => {
    const { email, password, type } = req.body;
    try {
        console.log("Login de usuário!\n");

        if (!email || !password) {
            return HandleError(res, 400, "E-mail ou senha não fornecidos.");
        }
        
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            return HandleError(res, 400, "Formato de e-mail inválido.");
        }

        let userModel = getUserModel(type);
        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const userData = await userModel.findOne({ email });
        if (!userData) return HandleError(res, 400, "Usuário não cadastrado");

        if (!userData.verified) {
            const otpfromLoginData = {
                otp: true,
                _id: userData._id,
                type: userData.type
            }
            return HandleError(res, 401, "Conta não verificada. Verifique sua conta antes de fazer login.", otpfromLoginData);
        }

        const data = {
            email: email,
            password: password
        }

        return HandleSuccess(res, 200, "Validação de Login feita com sucesso", data, MessageTypes.SUCCESS);
    } catch (err) {
        console.error("Erro ao autenticar o usuário: ", err);
        return HandleError(res, 500, "Erro ao logar usuário");
    }
}

exports.logoutUser = async (req, res) => {
    try {
        const { pushToken } = req.body;
        const { uid } = req.user;

        console.log("LOGOUT USER...");
        console.log("Push Token para retirar no Logout: ", pushToken);

        if (!uid) return HandleError(res, 401, "Usuário não autorizado");

        console.log("Usuário a ser deslogado: ", uid);

        let user = await PatientUser.findOne({ uid: uid }) || await DoctorUser.findOne({ uid: uid });
        if (!user) return HandleError(res, 404, "Usuário não encontrado");
        
        // Processo de remoção de PushToken (Desabilitado para fins de testes):
        
        const tokenData = await getTokenFromFirebase(uid, pushToken);
        if (tokenData) {
            const { key: tokenKey } = tokenData;
            await removeTokenOnFirebase(user.uid, tokenKey);
            user.pushTokenKeys = user.pushTokenKeys.filter(key => key !== tokenKey);
            console.log("TOKEN REMOVIDO!!", tokenKey);
        } else {
            console.log("Token especificado não encontrado, pode já ter sido removido.");
        }
        await user.save();

        console.log(`Token removido e usuário ${uid} deslogado com sucesso!`)
        return HandleSuccess(res, 200, undefined, undefined);
    } catch (err) {
        console.error("Erro ao deslogar usuário: ", err);
        return HandleError(res, 500, "Erro ao deslogar usuário");
    }
}

exports.confirmRequest = async (req, res) => {
    return HandleSuccess(res, 200, "Autorizado");
}