const router = require("express").Router();
const tokenMiddleware = require('../../middlewares/tokenMiddleware');
const conversationController = require('../../controller/chat/conversationController');

router.get('/get-conversation', tokenMiddleware.verifyUidToken, conversationController.getConversationTreatment);
router.post('/save-message', tokenMiddleware.verifyUidToken, conversationController.saveNewMessage);
router.get('/get-messages', tokenMiddleware.verifyUidToken, conversationController.getMessages);
router.post('/add-messages-to-note', tokenMiddleware.verifyUidToken, conversationController.addMessagesToNote);

module.exports = router;