//---notification.js---//

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    data: {
        type: Object,
        default: {},
    },
},
    { timestamps: true }
);

const Notification = mongoose.model('notification', notificationSchema, 'notification_data');

module.exports = Notification;