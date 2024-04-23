const { getUserModel } = require("../../utils/model");
const { createRandomBytes } = require("../../utils/security");
const { sendMailService } = require("../../services/mailService");
const ResetToken = require('../../models/reset_token');
const { HandleError, HandleSuccess } = require('../../utils/handleResponse.js');
const { formatDateRelative } = require('../../utils/formatDate');
const bcrypt = require('bcryptjs');
const MessageTypes = require("../../utils/typeResponse.js");

exports.forgotPassword = async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!email) HandleError(res, 400, "Por favor, entre com um email válido");
        if (!type) return HandleError(res, 400, "Tipo de usuário não especificado. Tente novamente.");

        let userModel = getUserModel(type);

        const user = await userModel.findOne({ email: email });
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        const token = await ResetToken.findOne({ owner: user._id });
        if (token) return HandleError(res, 400, `Você já solicitou a redefinição de senha há ${formatDateRelative(token.createdAt)}. Por favor, aguarde uma hora após a última solicitação antes de tentar novamente.`);

        const newTokenForResetPass = await createRandomBytes();

        const resetToken = new ResetToken({ owner: user._id, token: newTokenForResetPass })
        await resetToken.save();

        console.log(`URL para resetar senha: ${process.env.RESETPASS_URL}/reset-password?token=${newTokenForResetPass}&id=${user._id}&type=${user.type}`);

        await sendMailService("resetPasswordEmail", {
            userData: { email: user.email, name: user.name },
            resetLink: `${process.env.RESETPASS_URL}/reset-password?token=${newTokenForResetPass}&id=${user._id}&type=${user.type}`,
        });

        return HandleSuccess(res, 200, 'O link para resetar sua senha foi enviado para seu e-mail.', undefined, MessageTypes.EMAIL_SENT);
    }
    catch (err) {
        console.error("Erro ao requisitar mudança de senha ao usuário: ", err);
        return HandleError(res, 500, "Erro ao requisitar mudança de senha");
    }

}


exports.resetPassword = async (req, res) => {
    console.log("Reset Password Request");

    try {
        const { password } = req.body;
        const type = req.type;
        let userModel = getUserModel(type);

        if (!userModel) return HandleError(res, 400, "Tipo de usuário não especificado");

        const user = await userModel.findById(req.user._id);
        if (!user) return HandleError(res, 404, "Usuário não encontrado");

        const passMatched = await user.comparePassword(password);

        if (passMatched) return HandleError(res, 400, 'A nova senha não pode ser igual a senha anterior!');

        if (password.trim().length < 8 || password.trim().length > 25) {
            return res.status(400).json({ success: false, errors: ['Senha inválida. Deve ser entre 8 à 25 caracteres!'] });
        }

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(password, salt);

        user.password = newPassword.trim();

        await user.save();
        await ResetToken.findOneAndDelete({ owner: user._id });

        sendMailService("passwordUpdatedEmail", {
            userData: { email: user.email, name: user.name }
        });

        return HandleSuccess(res, 200, 'Sua senha foi alterada com sucesso!');
    }
    catch (err) {
        console.error("Houve um erro interno no servidor: ", err);
        return HandleError(res, 500, "Erro ao alterar senha");
    }
}
