const notification = require('../models/notification');
const users = require('../models/users');
const jwt = require('jsonwebtoken');
const jwt_mainKey = require('../config').jwt_key;

exports.createNotification = async (notificationData) => {
    try {

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.getNotifications = async () => {
    try {

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.deleteNotification = async () => {
    try {

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
};

exports.updateNotification = async () => {
    try {

    }
    catch (err) {
        console.error("Erro ao criar notificação: ", err);
        return res.status(500).json({ success: false, errors: ['Erro interno do servidor.'] });
    }
}
