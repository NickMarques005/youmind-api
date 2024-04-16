//----notifications_route.js----//

const express = require('express');
const bodyparser = require('body-parser');
const router = express.Router();
const notificationController = require('../../controller/notification/notificationController');
const tokenMiddleware = require('../../middlewares/tokenMiddleware');

const jsonParser = bodyparser.json();
const httpParser = bodyparser.urlencoded({ extended: false });

router.post('/push/register', jsonParser, tokenMiddleware.verifyToken, notificationController.registerPushNotification);
router.post('/treatment/solicitation', tokenMiddleware.verifyToken, notificationController.notifyTreatmentSolicitation);
router.get('/user/all', tokenMiddleware.verifyToken, notificationController.getNotifications);
router.delete('/user/delete',tokenMiddleware.verifyToken,  notificationController.deleteNotification);
router.put('/user/update', tokenMiddleware.verifyToken, notificationController.updateNotification);

module.exports = router;