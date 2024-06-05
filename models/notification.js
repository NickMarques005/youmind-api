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
    icon: {
        type: String,
        required: false
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24*60* 60*1000),
    }
},
    { timestamps: true }
);

notificationSchema.index({ expiresAt: 1 }, { sparse: true, expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema, 'notification_data');

module.exports = Notification;