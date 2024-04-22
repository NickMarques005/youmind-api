const OAuthData = require('../../models/oauth');
const { HandleError, HandleSuccess } = require('../../utils/handleResponse');

exports.saveEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return HandleError(res, 400, "E-mail não foi declarado");
        }

        const newOAuthData = new OAuthData({ email });
        await newOAuthData.save();
        return HandleSuccess(res, 201, 'E-mail e refreshToken salvos com sucesso.');
    } catch (err) {
        console.log(err);
        return HandleError(res, 500, `${'Erro ao salvar o e-mail e refreshToken: ' + err.message}`)
    }
};


exports.updateEmail = async (req, res) => {
    try {
        const { email, newEmail } = req.body;

        if (!email || !newEmail) {
            return HandleError(res, 400, "E-mail atual e novo e-mail são necessários");
        }

        if(email === newEmail) return HandleError(res, 400, "Os e-mails não podem ser iguais!");

        const updatedOAuthData = await OAuthData.findOneAndUpdate(
            { email },
            { $set: { email: newEmail } },
            { new: true }
        );

        if (!updatedOAuthData) {
            return HandleError(res, 404, 'E-mail não encontrado.');
        }
        HandleSuccess(res, 200, 'E-mail  atualizado com sucesso.'); 
    } catch (err) {
        console.log(err);
        return HandleError(res, 500, `${'Erro ao atualizar o e-mail: ' + err.message}`)
    }
};

