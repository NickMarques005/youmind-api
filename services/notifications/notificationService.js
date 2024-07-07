const { createNotification, sendPushNotification } = require('../../utils/notification/pushNotification');
const { getTokenFromFirebase } = require('../../firebase/push_notification/push_notification');

const sendNotificationToAllDevices = async (uid, notification) => {
    try {
        const pushTokenKeys = await getTokenFromFirebase(uid);
        if (!pushTokenKeys) {
            console.log('Nenhum token encontrado para UID:', uid);
            return await sendPushNotificationAndSave(notification, undefined, uid);
        } else {
            console.log("Push Keys: ", pushTokenKeys);
            
            const notificationId = await createNotification(notification, uid);
            if (!notificationId) {
                console.log("Falha ao criar notificação no banco de dados");
                return { success: false };
            }

            const pushPromises = [];
            for (let tokenKey in pushTokenKeys) {
                console.log("Key que receberá notificação: ", tokenKey);
                pushPromises.push(sendPushNotification(notification, notificationId, pushTokenKeys[tokenKey].token));
            }
            
            const results = await Promise.all(pushPromises);
            const serviceCompleted = { success: results.every(result => result) };
            return serviceCompleted;
        }
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