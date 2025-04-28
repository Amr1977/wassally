// signin_controller.js

import { signinUser } from './model.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signin-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Input Validation
    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    try {
      const user = await signinUser(email, password);
      const role = user.role;

      // Role-based navigation
      if (role === 'client') {
        window.location.href = 'client_home.html';
      } else if (role === 'courier') {
        window.location.href = 'courier_home.html';
      } else {
        alert('تعذر تحديد دور المستخدم.');
      }
    } catch (err) {
      alert('خطأ أثناء تسجيل الدخول: ' + err.message);
    }
  });
});