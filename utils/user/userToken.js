const jwt = require('jsonwebtoken');

const generateUserToken = (data) => {
    const expiresIn = '1h';
    const secretKey = process.env.JWT_MAIN_KEY;
    const token = jwt.sign({ data }, secretKey, { expiresIn });
    return token;
}

const verifyUserToken = (token) => {
    const secretKey = process.env.JWT_MAIN_KEY;
    try {
        const decoded = jwt.verify(token, secretKey);
        return { valid: true, data: decoded.data };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

module.exports = { verifyUserToken, generateUserToken};