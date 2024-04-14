
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const OAuthCreation = (params) => {
    return new OAuth2(
        params.clientId,
        params.clientSecret,
        params.uri
    )
}

const getOAuthAccessToken = async (oauth2Client) => {

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Falha na criação de access token.. ");
            }
            resolve(token);
        });
    });

    return accessToken;
}


exports.SettingOAuthClient = async (params) => {
    const oauth2Client = OAuthCreation(params);
    oauth2Client.setCredentials({
        refresh_token: params.refreshToken
    });
    const accessToken = await getOAuthAccessToken(oauth2Client);
    
    return accessToken;
};

