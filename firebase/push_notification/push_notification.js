const { firebase_db, firebase_messaging } = require('../firebase_config');
const { v4: uuidv4 } = require('uuid');

const saveTokenOnFirebase = async (uid, token) => {
    try {
        const tokenKey = uuidv4();
        await firebase_db.ref(`/userTokens/${uid}/${tokenKey}`).set({ token });
        console.log('Token salvo com sucesso!', tokenKey);
        return tokenKey;
    } catch (err) {
        console.error('Erro ao salvar token:', err);
        return null;
    }
}

const removeTokenOnFirebase = async (uid, tokenKey) => {
    try {
        await firebase_db.ref(`/userTokens/${uid}/${tokenKey}`).remove();
        return console.log('Token removido com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar token:', err);
    }
}

const getTokenFromFirebase = async (uid, pushToken = null) => {
    try {
        console.log("GET TOKEN: ", uid);
        const snapshot = await firebase_db.ref(`/userTokens/${uid}/`).once('value');
        const tokens = snapshot.val();
        if (pushToken) {
            for (let key in tokens) {
                if (tokens[key].token === pushToken) {
                    console.log('Push keys recuperado com sucesso:', key);
                    return { key, token: tokens[key].token };
                }
            }
            return null;
        }
        console.log('Push keys recuperado com sucesso:', tokens);
        return tokens;
    } catch (error) {
        console.error('Erro ao recuperar push token:', error);
        return null;
    }
}

const sendPushNotification = async (token, message) => {
    const messagePayload = {
        notification: {
            title: message.title,
            body: message.body
        },
        token: token,
    }

    try {
        const response = await firebase_messaging.send(messagePayload);
        return console.log("Mensagem enviada com sucesso ao remetente: ", response);
    }
    catch (err) {
        console.error("Erro ao enviar mensagem: ", err);
    }
}

module.exports = {
    saveTokenOnFirebase,
    getTokenFromFirebase,
    removeTokenOnFirebase
}