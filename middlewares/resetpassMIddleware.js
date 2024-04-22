const { isValidObjectId } = require("mongoose");
const ResetToken = require('../models/reset_token');
const { getUserModel } = require("../utils/model");
const { HandleError } = require("../utils/handleResponse");

exports.isResetTokenValid = async (req, res, next) => {
    try {
        const { token, id, type } = req.query;
        console.log("Middleware Reset Token Validation!");
        if (!token || !id || !type) return HandleError(res, 400, "Requisição inválida");

        if (!isValidObjectId(id)) return HandleError(res, 400, "Usuário inválido");

        let userModel = getUserModel(type, res);

        const user = await userModel.findById(id);
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        const resetToken = await ResetToken.findOne({ owner: user._id });
        if (!resetToken) return HandleError(res, 401, "Token de redefinição não encontrado");

        const isMatched = await resetToken.compareToken(token);

        if (!isMatched) return HandleError(res, 401, "Token de redefinição inválido");

        console.log("Usuário validado para trocar senha!!");
        req.user = user;
        req.type = type;

        next();
    }
    catch (err) {
        console.error("Houve um erro ao validar reset token: ", err);
        return HandleError(res, 401, "Não autorizado");
    }
}