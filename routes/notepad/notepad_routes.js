//---notepad_routes.js---//

const router = require("express").Router();
const tokenMiddleware = require('../../middlewares/tokenMiddleware');
const notepadController = require('../../controller/notepad/notepadController');

router.post('/create', tokenMiddleware.verifyToken, notepadController.createNewNote);
router.get('/read', tokenMiddleware.verifyToken, notepadController.readNotes);
router.post('/delete', tokenMiddleware.verifyToken, notepadController.deleteNote);

module.exports = router;



