const { isValidObjectId } = require("mongoose");
const ResetToken = require('../models/reset_token');
const { getUserModel } = require("../utils/db/model");
const { HandleError } = require("../utils/response/handleResponse");
const { verifyUserToken } = require('../utils/user/userToken');

exports.isResetTokenValid = async (req, res, next) => {
    try {
        const { token, user } = req.query;
        console.log("Middleware Reset Token Validation!");
        if (!token || !user) return HandleError(res, 400, "Requisição inválida");

        const verification = verifyUserToken(user);
        if (!verification.valid) {
            return HandleError(res, 403, "Não autorizado");
        }

        const data = verification.data;

        if (!isValidObjectId(data.userId)) return HandleError(res, 400, "Usuário inválido");

        let userModel = getUserModel(data.type);
        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const userData = await userModel.findById(data.userId);
        if (!userData) return HandleError(res, 404, "Usuário não encontrado");

        const resetToken = await ResetToken.findOne({ owner: userData._id });
        if (!resetToken) return HandleError(res, 401, "Token de redefinição expirado ou inválido");

        const isMatched = await resetToken.compareToken(token);
        if (!isMatched) return HandleError(res, 401, "Token de redefinição inválido");

        console.log("Usuário validado para trocar senha!!");
        req.user = { id: data.userId, type: data.type };

        next();
    }
    catch (err) {
        console.error("Houve um erro ao validar reset token: ", err);
        return HandleError(res, 401, "Não autorizado");
    }
}