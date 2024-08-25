
const express = require('express');
const bodyparser = require('body-parser');
const router = express.Router();
const notificationController = require('../../controller/notification/notificationController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');

const jsonParser = bodyparser.json();
const httpParser = bodyparser.urlencoded({ extended: false });

router.post('/push/register', jsonParser, tokenMiddleware.verifyUidToken, notificationController.registerPushNotification);
router.get('/user/all', tokenMiddleware.verifyUidToken, notificationController.getNotifications);
router.delete('/user/delete',tokenMiddleware.verifyUidToken,  notificationController.deleteNotification);
router.delete('/user/delete-many',tokenMiddleware.verifyUidToken,  notificationController.deleteNotifications);
router.put('/user/update', tokenMiddleware.verifyUidToken, notificationController.updateNotification);

module.exports = router;