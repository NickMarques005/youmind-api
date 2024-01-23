const notificationModel = require('../models/notification');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;

exports.sendNotification = async (notification, pushToken) => {
    const { Expo } = require('expo-server-sdk');
    const expo = new Expo();
    console.log("Notification Data: ", notification, " // pushToken: ", pushToken);
    try {
        const notificationToSend = {
            to: pushToken,
            title: notification.title,
            body: notification.body,
            data: notification.data
        }

        expo.sendPushNotificationsAsync([notificationToSend]);

        return console.log("Notificação enviada!!!");
    }
    catch (err) {
        return console.error("Houve um erro ao enviar a notificação ao usuário: ", err);
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

        
        return console.log("Notificação criada com sucesso");
    }
    catch (err) {
        return console.error("Erro ao criar notificação: ", err);
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

