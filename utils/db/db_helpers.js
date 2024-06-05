const OAuthData = require('../../models/oauth');
const { PatientUser, DoctorUser } = require('../../models/users');

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

const getDefaultExpirationDate = () => {
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000; 
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + oneDayInMilliseconds); 
    return expirationDate;
}

const findAndUpdateUserOnlineStatus = async (uid, onlineStatus) => {
    let user = await PatientUser.findOneAndUpdate({ uid }, { online: onlineStatus }, { new: true });
    if (!user) {
        user = await DoctorUser.findOneAndUpdate({ uid }, { online: onlineStatus }, { new: true });
    }
    return user;
}

module.exports = { getOAuthRefreshToken, saveOAuthRefreshToken, findAndUpdateUserOnlineStatus, getDefaultExpirationDate }