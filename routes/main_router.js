const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth/authenticate_routes'));
router.use('/user', require('./user/user_routes'));
router.use('/treatment', require('./treatment/treatment_routes'));
router.use('/chat', require('./conversation/conversation_routes'));
router.use('/notepad', require('./notepad/notepad_routes'));
router.use('/notifications', require('./notification/notifications_route'));
router.use('/admin', require('./admin/admin_routes'));
router.use('/health', require('./health/health_routes'));
router.use('/solicitation', require('./solicitation/solicitation_routes'));

module.exports = router;