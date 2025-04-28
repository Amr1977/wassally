// courier_view_jobs_controller.js

import { fetch_jobs, apply_for_job } from './model.js';

document.addEventListener('DOMContentLoaded', async () => {
  const jobs_list = document.getElementById('jobs_list');
  if (!jobs_list) return;

  jobs_list.innerHTML = '<p>جاري تحميل المهام...</p>';
  try {
    const jobs = await fetch_jobs();
    jobs_list.innerHTML = '';

    jobs.forEach(job => {
      const div = document.createElement('div');
      div.innerHTML = `
        <h3>${job.title}</h3>
        <p>${job.description}</p>
        <p>العميل: ${job.client_name}</p>
        <button class="apply_btn" data-job-id="${job.id}">التقديم</button>
        <hr>
      `;
      jobs_list.appendChild(div);
    });

  } catch (err) {
    jobs_list.innerHTML = '<p>تعذر تحميل الوظائف، يرجى المحاولة لاحقاً.</p>';
    console.error('Error fetching jobs:', err);
  }
});

document.getElementById('jobs_list').addEventListener('click', async (e) => {
  if (e.target.classList.contains('apply_btn')) {
    const job_id = e.target.getAttribute('data-job-id');
    try {
      await apply_for_job(job_id);
      alert('تم التقديم على الوظيفة');
      window.location.reload();
    } catch (err) {
      alert('خطأ أثناء التقديم: ' + err.message);
    }
  }
});