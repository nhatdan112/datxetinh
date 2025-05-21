const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const ValidationMiddleware = require('../middlewares/ValidationMiddleware');
const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('user', 'admin').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

router.post('/register', ValidationMiddleware(registerSchema), async (req, res, next) => {
  const { email, password, role } = req.body;
  try {
    const { userId, token } = await AuthService.register(email, password, role);
    res.status(201).json({ userId, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/login', ValidationMiddleware(loginSchema), async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { userId, token } = await AuthService.login(email, password);
    res.json({ userId, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Login failed' });
  }
});

module.exports = router;