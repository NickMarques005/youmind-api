//---verifyToken.js---//

const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader)
    {
        return res.status(401).json({ success: false, errors: ["Usuário não autorizado"] });
    }

    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token, jwt_mainKey);
        req.userId = decoded.user.id;
        next();
    }
    catch(err)
    {
        return res.status(401).json({success: false, errors: ["Token inválido"]});
    }
}

module.exports = { verifyToken };



