const express = require('express');
const { createUser, listUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));
router.route('/').post(createUser).get(listUsers);

module.exports = router;
