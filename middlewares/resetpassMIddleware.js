const { isValidObjectId } = require("mongoose");
const reset_token = require('../models/reset_token');
const { getUserModel } = require("../utils/model");

exports.isResetTokenValid = async (req, res, next) => {
    const { token, id, type } = req.query;
    if (!token || !id || !type) return res.status(401).json({ success: false, errors: ['Requisição inválida'] });


    if (!isValidObjectId(id)) return res.status(401).json({ success: false, errors: ['Usuário inválido'] });

    let userModel = getUserModel(type, res);

    if (!userModel) {
        return res
            .status(400)
            .json({
                success: false,
                errors: ["Tipo de usuário não especificado"],
            });
    }

    const user = await userModel.findById(id);
    if (!user) return res.status(400).json({ success: false, errors: [`Usuário não encontrado`] });

    const resetToken = await reset_token.findOne({ owner: user._id });
    if (!resetToken) return res.status(400).json({ success: false, errors: ['Reset Token não encontrado'] });

    const isMatched = await resetToken.compareToken(token);

    if(!isMatched) return res.status(400).json({ success: false, errors: ['Reset Token inválido'] });

    console.log("Usuário validado para trocar senha!!");
    req.user = user;
    req.type = type;

    next();
}