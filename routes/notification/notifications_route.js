//----notifications_route.js----//

const express = require('express');
const bodyparser = require('body-parser');
const router = express.Router();
const notificationController = require('../../controller/notification/notificationController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');

const jsonParser = bodyparser.json();
const httpParser = bodyparser.urlencoded({ extended: false });

router.post('/register-push-notification', jsonParser, tokenMiddleware.verifyToken, notificationController.registerPushNotification);
router.post('/notify-treatment-solicitation', tokenMiddleware.verifyToken, notificationController.notifyTreatmentSolicitation);
router.get('/get-notification', tokenMiddleware.verifyToken, notificationController.getNotifications);
router.delete('/delete-notification',tokenMiddleware.verifyToken,  notificationController.deleteNotification);
router.put('/update-notification', tokenMiddleware.verifyToken, notificationController.updateNotification);

module.exports = router;