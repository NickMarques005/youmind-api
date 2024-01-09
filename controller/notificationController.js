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

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
}
