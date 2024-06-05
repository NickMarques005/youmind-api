const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const { getOAuthRefreshToken } = require('../db/db_helpers');
const { youmind_email } = require('../../config');

const OAuthCreation = (params) => {
    return new OAuth2(
        params.clientId,
        params.clientSecret,
        params.uri
    )
}

const getOAuthAccessToken = async (oauth2Client) => {

    try {
        console.log("GET ACCESS TOKEN!!");
        const { token, res } = await oauth2Client.getAccessToken();
        console.log("RESPONSE: ", res, token);

        const currentTime = new Date().getTime();
        const expiresIn = res.data.expiry_date - currentTime;
        if (expiresIn <= 300000) {
            console.log("Faltando 5 minutos para Access Token expirar. Refreshing....");
            return await this.refreshAccessToken(oauth2Client);
        }

        return token;
    } catch (err) {
        console.error("Erro ao obter AccessToken: ", err);
    }
}

const refreshOAuthAccessToken = async (oauth2Client) => {
    try {
        console.log("REFRESH ACCESS TOKEN!");
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log(credentials);
        const { access_token } = credentials;
        return access_token;
    }
    catch (err) {
        console.error('Falha no refresh access token: ', error);
        throw new Error('Falha em Refresh Access Token');
    }
}

const SettingOAuthClient = async (params) => {
    const oauth2Client = OAuthCreation(params);
    const refreshToken = await getOAuthRefreshToken(youmind_email);

    if (!refreshToken) {
        throw new Error("No Refresh Token");
    }

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    const accessToken = await getOAuthAccessToken(oauth2Client, youmind_email);

    return accessToken;
};

module.exports = { getOAuthAccessToken, SettingOAuthClient, refreshOAuthAccessToken}

/*
exports.GenerateAuthUrl = () => {
    const oauth2Client = OAuthCreation({
        clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
        clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
        uri: process.env.GMAIL_OAUTH_REDIRECT_URL
    });

    const GMAIL_SCOPES = [
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.send',
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: GMAIL_SCOPES,
    });

    console.log("URL: ", url);

    return url;
};


exports.getGoogleOAuthTokens = async ({ code }) => {
    const url = "https://oauth2.googleapis.com/token";

    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
    };

    try {
        const res = await axios.post(url, qs.stringify(values), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        console.log("Google Request: ", res);
        return res.data;
    } catch (error) {
        console.error("Failed to fetch Google OAuth Tokens: ", error.response?.data?.error);
        throw new Error(error.response?.data?.error);
    }
}*/


