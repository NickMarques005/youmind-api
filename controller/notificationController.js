const notification = require('../models/notification');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;

exports.createNotification = async (notificationData) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) {
        return res.status(401).json({ errors: ["Usuário não autorizado"] });
    }

    try {
        const decodedToken = jwt.verify(authToken, jwt_mainKey);
        const userId = decodedToken.user.id;

        const newNotification = new Notification({
            user: userId,
            title: notificationData.title,
            body: notificationData.body,
            data: notificationData.data,
        });

        const savedNotification = await newNotification.save();

        if (!savedNotification) {
            return res.status(400).json({ success: false, errors: ["Houve um erro ao salvar a notificação!"] });
        }

        return res.status(201).json({ success: true, notification: savedNotification });

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.getNotifications = async () => {
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

exports.deleteNotification = async () => {
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

exports.updateNotification = async () => {
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

        if(!updatedNotification)
        {
            return res.status(404).json({ success: false, errors: ["Notificação não encontrada"] });
        }

        return res.status(200).json({ success: true, notification: updatedNotification, message: "Mensagem atualizada com sucesso!"});
    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
}
