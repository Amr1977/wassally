// courier_view_jobs_controller.js

import { fetchJobs, applyForJob } from './model.js';

document.addEventListener('DOMContentLoaded', async () => {
  const jobsList = document.getElementById('jobs-list');
  if (!jobsList) return;

  jobsList.innerHTML = '<p>جاري تحميل المهام...</p>';
  try {
    const jobs = await fetchJobs();
    jobsList.innerHTML = '';

    jobs.forEach(job => {
      const div = document.createElement('div');
      div.innerHTML = `
        <h3>${job.title}</h3>
        <p>${job.description}</p>
        <p>العميل: ${job.clientName}</p>
        <button class="apply-btn" data-job-id="${job.id}">التقديم</button>
        <hr>
      `;
      jobsList.appendChild(div);
    });

  } catch (err) {
    jobsList.innerHTML = '<p>تعذر تحميل الوظائف، يرجى المحاولة لاحقاً.</p>';
    console.error('Error fetching jobs:', err);
  }
});

document.getElementById('jobs-list').addEventListener('click', async (e) => {
  if (e.target.classList.contains('apply-btn')) {
    const jobId = e.target.getAttribute('data-job-id');
    try {
      await applyForJob(jobId);
      alert('تم التقديم على الوظيفة');
      window.location.reload();
    } catch (err) {
      alert('خطأ أثناء التقديم: ' + err.message);
    }
  }
});