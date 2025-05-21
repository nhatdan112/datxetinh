const UserModel = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppConfig = require('../config/AppConfig');

class AuthService {
  async register({ email, password, role }) {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new Error('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      email,
      password: hashedPassword,
      role: role || 'user',
    });
    await user.save();
    const token = jwt.sign({ userId: user._id, role: user.role }, AppConfig.jwtSecret, {
      expiresIn: '1h',
    });
    return { token, userId: user._id };
  }

  async login({ email, password }) {
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, AppConfig.jwtSecret, {
      expiresIn: '1h',
    });
    return { token, userId: user._id };
  }
}

module.exports = new AuthService();