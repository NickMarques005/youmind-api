const router = require("express").Router();
const tokenMiddleware = require('../middlewares/tokenMiddleware');
const conversationController = require('../controller/conversationController');

router.post('/getConversationTreatment', tokenMiddleware.verifyToken, conversationController.getConversationTreatment);
router.post('/saveNewMessage', tokenMiddleware.verifyToken, conversationController.saveNewMessage);
router.post('/getMessages', tokenMiddleware.verifyToken, conversationController.getMessages);

module.exports = router;