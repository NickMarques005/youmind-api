const notificationModel = require('../models/notification');

exports.sendPushNotification = async (notification, _id, pushToken) => {
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();
    console.log("Notification Data: ", notification, " // pushToken: ", pushToken, " // message Id: ", _id);
    try {
        const notificationToSend = {
            to: pushToken,
            title: notification.title,
            body: notification.body,
            data: { ...notification.data, _id }
        }

        let receipts = await expo.sendPushNotificationsAsync([notificationToSend]);
        return console.log("Notificação enviada: ", receipts);
    }
    catch (err) {
        console.error("Houve um erro ao enviar a notificação ao usuário: ", err);
        return;
    }
}

exports.createNotification = async (notificationData, userId) => {
    console.log("NOTIFICATION CREATION IN DB....");
    if (!userId) {
        console.log("Houve um erro! Usuário não fornecido");
        return console.log("Usuário não encontrado");
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
            return console.log("Houve um erro ao salvar a notificação!");
        }

        console.log("Notificação criada com sucesso")

        return savedNotification._id;
    }
    catch (err) {
        return console.error("Erro ao criar notificação: ", err);
    }
};