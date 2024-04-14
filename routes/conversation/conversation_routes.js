const router = require("express").Router();
const tokenMiddleware = require('../../middlewares/tokenMiddleware');
const conversationController = require('../../controller/chat/conversationController');

router.get('/get-conversation', tokenMiddleware.verifyToken, conversationController.getConversationTreatment);
router.post('/save-message', tokenMiddleware.verifyToken, conversationController.saveNewMessage);
router.get('/get-messages', tokenMiddleware.verifyToken, conversationController.getMessages);

module.exports = router;