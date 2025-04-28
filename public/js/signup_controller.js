// signup_controller.js

import { signup_user } from './model.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
      await signup_user(username, email, password, role);
      if (role === 'client') {
        window.location.href = 'client_home.html';
      } else {
        window.location.href = 'courier_home.html';
      }
    } catch (err) {
      alert('خطأ أثناء إنشاء الحساب: ' + err.message);
    }
  });
});