const notificationController = require('../controller/notificationController');

const sendPushNotificationAndSave = async (notificationData, token) => {
    try {
        console.log("TOKEN NOTIFICATION SAVE: ", token);
        await notificationController.createNotification(notificationData, token);

        
        console.log("Push Notification enviada e notificação salva com sucesso");
    }
    catch (err) {
        console.error("Erro ao enviar Push Notification e salvar notificação: ", err);
    }
};

module.exports = { sendPushNotificationAndSave };