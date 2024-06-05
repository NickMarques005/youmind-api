
const router = require("express").Router();
const tokenMiddleware = require('../../middlewares/tokenMiddleware');
const notepadController = require('../../controller/notepad/notepadController');

router.post('/create', tokenMiddleware.verifyUidToken, notepadController.createNewNote);
router.get('/read', tokenMiddleware.verifyUidToken, notepadController.readNotes);
router.delete('/delete/:id', tokenMiddleware.verifyUidToken, notepadController.deleteNote);
router.put('/update/:id', tokenMiddleware.verifyUidToken, notepadController.updateNote);

module.exports = router;



