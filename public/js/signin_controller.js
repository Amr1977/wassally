// signin_controller.js

import { signin_user } from './model.js';

import { add_log, get_logs, clear_logs } from "./indexeddb_logs.js";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signin_form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    add_log("signin_controller submit event.");
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Input validation
    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    try {
      const user = await signin_user(email, password);
      alert("user is logged in " + user);
      // Navigate based on user role
      if (user.role === 'client') {
        window.location.href = 'client_home.html';
      } else if (user.role === 'courier') {
        window.location.href = 'courier_home.html';
      } else {
        throw new Error('Invalid user role.');
      }
    } catch (err) {
      alert('خطأ أثناء تسجيل الدخول: ' + err.message);
      console.log('Login error:', err);
    }
  });
});