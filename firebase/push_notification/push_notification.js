const { firebase_db, firebase_messaging } = require('../firebase_config');


const saveTokenOnFirebase = async (userId, token) => {
    try {
        await firebase_db.ref(`/userTokens/${userId}`).set({ token });
        return console.log('Token salvo com sucesso!');
    } catch (err) {
        console.error('Erro ao salvar token:', err);
    }
}

const getTokenFromFirebase = async (userId) => {
    try {
        console.log("GET TOKEN: ", userId);
        const snapshot = await firebase_db.ref(`/userTokens/${userId}`).once('value');
        const data = snapshot.val();
        console.log('Push token recuperado com sucesso:', data);
        return data;
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
    catch (err)
    {
        console.error("Erro ao enviar mensagem: ", err);
    }
}

module.exports = {
    saveTokenOnFirebase,
    getTokenFromFirebase
}