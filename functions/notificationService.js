const notificationController = require('../controller/notificationController');

const sendPushNotificationAndSave = async (notificationData, pushToken, userId) => {
    try {
        console.log("TOKEN NOTIFICATION SAVE: ", pushToken);
        console.log("USER ID: ", userId);
        await notificationController.createNotification(notificationData, userId);

        await notificationController.sendNotification(notificationData, pushToken);
        
        console.log("Push Notification enviado e notificação salva com sucesso");
    }
    catch (err) {
        console.error("Erro ao enviar Push Notification e salvar notificação: ", err);
    }
};

module.exports = { sendPushNotificationAndSave };