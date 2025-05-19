/**
 * @file routes.js
 * @description Defines Express API endpoints.
 */
import express from 'express';
import * as auth from '../auth/auth.js';
import * as order_manager from '../orders/order_manager.js';
import * as pickup_dropoff from '../workflow/pickup_dropoff.js';

const router = express.Router();

// Authentication routes
router.post('/login', async (req, res) => {
  try {
    const token = await auth.login(req.body.email, req.body.password);
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const user = await auth.register(req.body);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Order routes
router.post('/order', async (req, res) => {
  try {
    const order = await order_manager.create_order(req.body);
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Pickup/Dropoff routes
router.post('/order/:order_id/pickup', (req, res) => {
  pickup_dropoff.record_pickup_arrival(req.params.order_id);
  res.json({ message: "Pickup arrival recorded" });
});

router.post('/order/:order_id/confirm-pickup', (req, res) => {
  pickup_dropoff.confirm_pickup(req.params.order_id);
  res.json({ message: "Pickup confirmed" });
});

export default router;