const jwt = require("jsonwebtoken");
const config_environment = require("../../config");
const { HandleError, HandleSuccess } = require("../../utils/response/handleResponse");

exports.refreshToken = async (req, res, next) => {

    try {
        const { refreshToken } = req.body;
        const refreshKey = config_environment.refresh_key;
        jwt.verify(refreshToken, refreshKey, (err, decode) => {
            if (err) {
                return HandleError(res, 400, `Erro ao verificar token: ${err}`);
            }

            const jwtKey = config_environment.jwt_key;
            const accessTokenExpiresIn = "55m";

            const userId = decode.user.id;
            const data_authentication = {
                user: {
                    id: userId,
                },
            };
            const newToken = jwt.sign(data_authentication, jwtKey, {
                expiresIn: accessTokenExpiresIn,
            });
            const newTokenExp = new Date(new Date().getTime() + 30 * 1000);

            const tokens = {
                accessToken: { token: newToken, exp: newTokenExp },
                refreshToken: { token: refreshToken },
            };

            return HandleSuccess(res, 200, "Token atualizado com sucesso!", tokens);
        });
    }
    catch (err) {
        console.error("Houve um erro interno no servidor: ", err);
        return HandleError(res, 500, "Erro ao atualizar access token");
    }
}
