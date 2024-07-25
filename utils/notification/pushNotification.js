const notificationModel = require('../../models/notification');
const { Expo } = require('expo-server-sdk');
const expo = new Expo({
    useFcmV1: true
});


exports.sendPushNotification = async (notification, _id, pushToken) => {

    console.log("Notification Data: ", notification, " \n// pushToken: ", pushToken, "\n // message Id: ", _id);
    try {
        const notificationToSend = {
            to: pushToken,
            title: notification.title,
            body: notification.body,
            data: { ...notification.data, _id },
            sound: 'default',
            icon: notification.icon ? notification.icon : ''
        }
        console.log("\n---> SEND PUSH NOTIFICATION SERVICE!!\n");
        let receipts = await expo.sendPushNotificationsAsync([notificationToSend]);
        console.log("Notificação enviada: ", receipts);
        return true;
    }
    catch (err) {
        console.error("Houve um erro ao enviar a notificação ao usuário: ", err);
        return false;
    }
}

exports.createNotification = async (notificationData, userId) => {
    console.log("NOTIFICATION CREATION IN DB....");
    if (!userId) {
        console.log("Houve um erro! Usuário não fornecido");
        return;
    }

    try {

        const newNotification = new notificationModel({
            user: userId,
            title: notificationData.title,
            body: notificationData.body,
            data: notificationData.data,
        });

        const savedNotification = await newNotification.save();

        if (!savedNotification) {
            return console.log("Houve um erro ao salvar a notificação! Notificação não foi salva no banco de dados");
        }

        console.log("Notificação criada com sucesso")

        return savedNotification._id;
    }
    catch (err) {
        return console.error("Erro ao criar notificação: ", err);
    }
};