// client_home_controller.js

import { postJob } from './model.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('post-job-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const budget = document.getElementById('budget').value;

    // Input Validation
    if (!title || !description || !budget || budget <= 0) {
      alert('يرجى ملء جميع الحقول بشكل صحيح.');
      return;
    }

    try {
      await postJob(title, description, budget);
      alert('تم نشر الوظيفة بنجاح');
      window.location.href = 'client_view_offers.html';
    } catch (err) {
      alert('خطأ أثناء نشر الوظيفة: ' + err.message);
    }
  });
});