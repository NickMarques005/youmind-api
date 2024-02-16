//----notifications_route.js----//

const express = require('express');
const bodyparser = require('body-parser');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const tokenMiddleware = require('../middlewares/tokenMiddleware');

const jsonParser = bodyparser.json();
const httpParser = bodyparser.urlencoded({ extended: false });

router.post('/registerPushNotification', jsonParser, tokenMiddleware.verifyToken, notificationController.registerPushNotification);
router.post('/notifyTreatmentSolicitation', tokenMiddleware.verifyToken, notificationController.notifyTreatmentSolicitation);
router.get('/getNotifications', tokenMiddleware.verifyToken, notificationController.getNotifications);
router.delete('/deleteNotification',tokenMiddleware.verifyToken,  notificationController.deleteNotification);
router.put('/updateNotification', tokenMiddleware.verifyToken, notificationController.updateNotification);

module.exports = router;