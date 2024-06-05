const { createNotification, sendPushNotification } = require('../utils/notification/pushNotification');
const { getTokenFromFirebase } = require('../firebase/push_notification/push_notification');

const sendNotificationToAllDevices = async (uid, notification) => {
    try {
        const pushTokenKeys = await getTokenFromFirebase(uid);
        let serviceCompleted;
        if (!pushTokenKeys) {
            console.log('Nenhum token encontrado para UID:', uid);
            serviceCompleted = await sendPushNotificationAndSave(notification, undefined, uid);
        }
        else {
            console.log("Push Keys: ", pushTokenKeys);

            for (let tokenKey in pushTokenKeys) {
                console.log("Key que receberá notificação: ", tokenKey);
                await sendPushNotificationAndSave(notification, pushTokenKeys[tokenKey].token, uid);
            }
            serviceCompleted = { success: true };
        }

        return serviceCompleted;
    } catch (error) {
        console.error('Erro ao enviar notificações para todos os dispositivos:', error);
        return { success: false, message: `${error}` };
    }
}

const sendPushNotificationAndSave = async (notificationData, pushToken, uid) => {
    try {
        console.log("TOKEN NOTIFICATION SAVE: ", pushToken);
        console.log("USER ID: ", uid);
        const notificationId = await createNotification(notificationData, uid);
        if (notificationId) {
            if (pushToken) {
                const notificationSent = await sendPushNotification(notificationData, notificationId, pushToken);
                return { success: notificationSent }
            }

            console.log("Usuário não possui push Token para receber PushNotification");
            return { success: true }
        }
        return { success: false }
    }
    catch (err) {
        console.error("Erro ao enviar Push Notification e salvar notificação: ", err);
        return { success: false }
    }
};

module.exports = { sendPushNotificationAndSave, sendNotificationToAllDevices };