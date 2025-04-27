// courier_view_jobs_controller.js

import { fetchJobs, applyForJob } from './model.js';

document.addEventListener('DOMContentLoaded', async () => {
  const jobsList = document.getElementById('jobs-list');
  if (!jobsList) return;

  try {
    const jobs = await fetchJobs();
    jobsList.innerHTML = '';

    jobs.forEach(job => {
      const div = document.createElement('div');
      div.innerHTML = `
        <h3>${job.title}</h3>
        <p>${job.description}</p>
        <p>العميل: ${job.clientName}</p>
        <button onclick="apply('${job.id}')">التقديم</button>
        <hr>
      `;
      jobsList.appendChild(div);
    });

  } catch (err) {
    jobsList.innerHTML = 'خطأ أثناء تحميل الوظائف: ' + err.message;
  }
});

window.apply = async (jobId) => {
  try {
    await applyForJob(jobId);
    alert('تم التقديم على الوظيفة');
    window.location.reload();
  } catch (err) {
    alert('خطأ أثناء التقديم: ' + err.message);
  }
};