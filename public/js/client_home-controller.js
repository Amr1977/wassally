// client_home_controller.js

import { post_job } from './model.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('post_job_form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const budget = document.getElementById('budget').value;

    // Input validation
    if (!title || !description || !budget || budget <= 0) {
      alert('يرجى ملء جميع الحقول بشكل صحيح.');
      return;
    }

    try {
      await post_job(title, description, budget);
      alert('تم نشر الوظيفة بنجاح');
      window.location.href = 'client_view_offers.html';
    } catch (err) {
      alert('خطأ أثناء نشر الوظيفة: ' + err.message);
    }
  });
});