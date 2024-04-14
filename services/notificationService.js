//---notificationService.js---//

const notificationController = require('../controller/notification/notificationController');

const sendPushNotificationAndSave = async (notificationData, pushToken, userId) => {
    try {
        console.log("TOKEN NOTIFICATION SAVE: ", pushToken);
        console.log("USER ID: ", userId);
        const notificationId = await notificationController.createNotification(notificationData, userId);

        if(notificationId)
        {
            await notificationController.sendNotification(notificationData, notificationId, pushToken);
            console.log("Push Notification enviado e notificação salva com sucesso");
        }  
        else {
            console.error("Erro ao criar notificação: ID não fornecido");
        }
    }
    catch (err) {
        console.error("Erro ao enviar Push Notification e salvar notificação: ", err);
    }
};

module.exports = { sendPushNotificationAndSave };