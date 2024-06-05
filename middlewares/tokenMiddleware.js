//---tokenMiddleware.js---//

const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;
const { HandleError } = require('../utils/response/handleResponse');
const { firebase_auth } = require('../firebase/firebase_config');

const verifySocketToken = async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token || !token.startsWith('Bearer ')) {
        const error = new Error("Não autorizado");
        error.data = { content: "Por favor, faça login novamente." };
        return next(error);
    }

    const actualToken = token.split(' ')[1];
    try {
        const decodedToken = await firebase_auth.verifyIdToken(actualToken);
        socket.user = { uid: decodedToken.uid };
        console.log("Token verificado em Socket: ", decodedToken.uid);
        next();
    } catch (err) {
        const error = new Error("Não autorizado");
        error.data = { content: "Sua sessão expirou. Faça login novamente." };
        return next(error);
    }
}

const verifyUidToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return HandleError(res, 401, "Não autorizado");
    }

    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await firebase_auth.verifyIdToken(idToken);
        req.user = { uid: decodedToken.uid };
        console.log("Token verificado: ", decodedToken.uid);
        next();
    } catch (err) {
        console.error("Erro na verificação do token:", err);
        if (err.code === 'auth/id-token-expired') {
            return HandleError(res, 401, "Sua sessão expirou. Por favor, faça login novamente.");
        }

        return HandleError(res, 403, "Token inválido");
    }
}

const verifyIdToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return HandleError(res, 401, "Não autorizado");
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwt_mainKey);
        req.user = { userId: decoded.user.id };
        console.log("Token verificado: ", decoded.user.id);
        next();
    }
    catch (err) {
        return HandleError(res, 401, "Não autorizado");
    }
}

module.exports = { verifyUidToken, verifyIdToken, verifySocketToken };