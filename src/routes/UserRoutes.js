const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const AuthMiddleware = require('../middlewares/AuthMiddleware');

router.get('/', AuthMiddleware, UserController.getAllUsers);
router.get('/:id', AuthMiddleware, UserController.getUserById);
router.put('/:id', AuthMiddleware, UserController.updateUser);
router.delete('/:id', AuthMiddleware, UserController.deleteUser);

module.exports = router;