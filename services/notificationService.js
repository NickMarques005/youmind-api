const { createNotification, sendPushNotification} = require('../utils/pushNotification');

const sendPushNotificationAndSave = async (notificationData, pushToken, userId) => {
    try {
        console.log("TOKEN NOTIFICATION SAVE: ", pushToken);
        console.log("USER ID: ", userId);
        const notificationId = await createNotification(notificationData, userId);

        if(notificationId)
        {
            await sendPushNotification(notificationData, notificationId, pushToken);
            return console.log("Push Notification enviado e notificação salva com sucesso");
        }  
        else {
            return console.error("Erro ao criar notificação: ID não fornecido");
        }
    }
    catch (err) {
        return console.error("Erro ao enviar Push Notification e salvar notificação: ", err);
    }
};

module.exports = { sendPushNotificationAndSave };