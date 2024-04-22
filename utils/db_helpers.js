const OAuthData = require('../models/oauth');

const getOAuthRefreshToken = async (email) => {
    try {
        const oauthData = await OAuthData.findOne({ email: email });
        return oauthData ? oauthData.refreshToken : null;
    } catch (err) {
        console.error("Erro ao buscar refreshToken:", err);
        return null;
    }
};

const saveOAuthRefreshToken = async (email, refreshToken) => {
    try {
        const oauthData = await OAuthData.findOneAndUpdate(
            { email: email },
            { refreshToken: refreshToken },
            { new: true, upsert: true }
        );
        return oauthData;
    } catch (err) {
        console.error("Erro ao salvar refreshToken:", err);
        return null;
    }
};

module.exports = { getOAuthRefreshToken, saveOAuthRefreshToken }

