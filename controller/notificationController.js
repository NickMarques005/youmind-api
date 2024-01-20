const notification = require('../models/notification');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;

exports.createNotification = async (notificationData, userId) => {
    if (!userId) {
        console.log("Houve um erro! Usuário não fornecido");
        return console.log("Usuário não encontrado");
    }

    try {

        const newNotification = new Notification({
            user: userId,
            title: notificationData.title,
            body: notificationData.body,
            data: notificationData.data,
        });

        const savedNotification = await newNotification.save();

        if (!savedNotification) {
            return console.log("Houve um erro ao salvar a notificação!");
        }

        console.log("Notificação criada com sucesso");
        return;
    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return console.log({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.getNotifications = async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ errors: ["Usuário não autorizado"] });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, notifications });
    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.deleteNotification = async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ errors: ["Usuário não autorizado"] });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const notificationId = req.body.notificationId;
        const deletedNotification = await Notification.findOneAndDelete({
            _id: notificationId,
            user: userId,
        });

        if (!deletedNotification) {
            return res.status(404).json({ success: false, errors: ["Notificação não encontrada"] });
        }

        return res.status(200).json({ success: true, message: "Notificação excluída com sucesso!" });

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.updateNotification = async (req, res) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ errors: ["Usuário não autorizado"] });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const notificationId = req.body.notificationId;
        const updatedData = req.body.notificationUpdate;

        const updatedNotification = await Notification.findOneAndUpdate({
            _id: notificationId,
            user: userId,
        },
            { $set: updatedData },
            { new: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({ success: false, errors: ["Notificação não encontrada"] });
        }

        return res.status(200).json({ success: true, notification: updatedNotification, message: "Mensagem atualizada com sucesso!" });
    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.sendPushNotification = async (notificationData, token) => {
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();

    const pushNotification = {
        to: token,
        title: notificationData.title,
        body: notificationData.body,
        badge: 1,
        data: notificationData.data
    };

    try {
        const send_notification = await expo.sendPushNotificationsAsync([pushNotification]);
        console.log("NOTIFICAÇÃO ENVIADA: ", send_notification);
    }
    catch (err)
    {
        console.error("Erro ao enviar Push Notification: ", err);
    }


}
