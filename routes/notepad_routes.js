//---notepad_routes.js---//

const router = require("express").Router();
const tokenMiddleware = require('../middlewares/tokenMiddleware');
const notepadController = require('../controller/notepadController');

router.post('/createNewNote', tokenMiddleware.verifyToken, notepadController.createNewNote);
router.post('/readNotes', tokenMiddleware.verifyToken, notepadController.readNotes);
router.post('/deleteNote', tokenMiddleware.verifyToken, notepadController.deleteNote);

module.exports = router;



