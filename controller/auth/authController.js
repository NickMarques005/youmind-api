//---authController.js---//

const config_environment = require("../../config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserModel } = require("../../utils/model");
const { HandleError , HandleSuccess } = require('../../utils/handleResponse');

const jwt_mainKey = config_environment.jwt_key;
const jwt_refreshKey = config_environment.refresh_key;

exports.authenticateUser = async (req, res) => {
    const { email, password, type } = req.body;
    try {
        console.log("Login de usuário!\n");
        let userModel = getUserModel(type);

        const userData = await userModel.findOne({ email });

        if (!userData) return HandleError(res, 400, "Usuário não cadastrado");

        const passwordCompare = await bcrypt.compare(password, userData.password);

        if (!passwordCompare) return HandleError(res, 400, "Senha incorreta");

        const accessTokenExpiresIn = "30s";
        const refreshTokenExpiresIn = "30d";

        const dataAuthentication = { user: { id: userData.id,} };

        const accessToken = jwt.sign(dataAuthentication, jwt_mainKey, { expiresIn: accessTokenExpiresIn });
        const refreshToken = jwt.sign(dataAuthentication, jwt_refreshKey, { expiresIn: refreshTokenExpiresIn });

        const tokens = {
            accessToken: { token: accessToken, exp: new Date(new Date().getTime() + 30 * 1000) },
            refreshToken: { token: refreshToken, exp: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) }
        }

        return HandleSuccess(res, 200, "Login feito com sucesso", tokens);
    } catch (err) {
        console.error("Erro ao autenticar o usuário: ", err);
        return HandleError(res, 500, "Erro ao logar usuário");
    }
}

exports.logoutUser = async (req, res) => {
    try {
        const { type } = req.body;
        const { userId } = req.user;

        console.log("LOGOUT USER...");

        if (!userId) return HandleError(res, 401, "Usuário não autorizado");

        console.log("Usuário a ser deslogado: ", userId);

        if (!type) return HandleError(res, 400, "Tipo de usuário não especificado. Tente novamente.");

        let userModel = getUserModel(type);

        const user = await userModel.findById(userId);

        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        //await firebase_service.saveToken(user._id, null);

        console.log(`Usuário ${user._id} deslogado com sucesso!`)
        return HandleSuccess(res, 200, "Sua conta foi deslogada com sucesso!");
    } catch (err) {
        console.error("Erro ao deslogar usuário: ", err);
        return HandleError(res, 500, "Erro ao deslogar usuário");
    }
}

exports.confirmRequest = async (req, res) => {
    return HandleSuccess(res, 200, "Autorizado");
}
