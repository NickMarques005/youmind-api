//---tokenMiddleware.js---//

const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;
const { HandleError } = require('../utils/handleResponse');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader)
    {
        return HandleError(res, 401, "Não autorizado");
    }

    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token, jwt_mainKey);
        req.user = { userId: decoded.user.id};
        console.log("Token verificado: ", decoded.user.id);
        next();
    }
    catch(err)
    {
        return HandleError(res, 401, "Não autorizado");
    }
}

module.exports = { verifyToken };



