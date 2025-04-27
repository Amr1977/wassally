// signin_controller.js

import { signinUser } from './model.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signin-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await signinUser(email, password);
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role === 'client') {
        window.location.href = 'client_home.html';
      } else {
        window.location.href = 'courier_home.html';
      }
    } catch (err) {
      alert('خطأ أثناء تسجيل الدخول: ' + err.message);
    }
  });
});