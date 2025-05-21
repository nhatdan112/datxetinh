const UserModel = require('../models/UserModel');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class UserController {
  async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.find();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await UserModel.findById(req.params.id);
      if (!user) throw new Error('User not found');
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!user) throw new Error('User not found');
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const user = await UserModel.findByIdAndDelete(req.params.id);
      if (!user) throw new Error('User not found');
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();