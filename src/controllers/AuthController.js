const AuthService = require('../services/AuthService');
const ErrorMiddleware = require('../middlewares/ErrorMiddleware');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const token = await AuthService.login(email, password);
      res.json({ token });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const user = await AuthService.register(email, password, name);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Assuming token-based logout (invalidate token on client-side)
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();