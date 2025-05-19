/**
 * @file auth.js
 * @description Manages authentication and authorization.
 */
import jwt from 'jsonwebtoken';
import { get_user_by_email, create_user } from '../users/profile.js';

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

/**
 * Authenticates a user and returns a JWT.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} JWT token.
 */
export async function login(email, password) {
  const user = await get_user_by_email(email);
  if (user && user.password === password) { // Reminder: hash passwords in production!
    return jwt.sign({ email: user.email, id: user.id }, SECRET_KEY, { expiresIn: '1h' });
  }
  throw new Error('Invalid credentials');
}

/**
 * Registers a new user.
 * @param {Object} user_data
 * @returns {Promise<Object>} The created user.
 */
export async function register(user_data) {
  return await create_user(user_data);
}

/**
 * Middleware to protect routes via JWT.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function auth_middleware(req, res, next) {
  const auth_header = req.headers['authorization'];
  const token = auth_header && auth_header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}