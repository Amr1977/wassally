// courier_view_jobs_controller.js

import { fetch_jobs } from './model.js';
import { open_offer_modal } from './send_offer_controller.js';

function append_send_offer_modal() {
  //TODO check if model exists to avoid appending repeatedly
  fetch("../send_offer_view.html")
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML("beforeend", html);
    });
}


alert("courier view jobs controller");
append_send_offer_modal();

const jobs_list = document.getElementById('jobs_list');
if (!jobs_list) {
  alert("jobs_list not found!!");
} else {
  append_send_offer_modal();
  jobs_list.innerHTML = '<p>جاري تحميل المهام...</p>';

  fetch_jobs()
    .then(jobs => {
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
    })
    .catch(err => {
      jobs_list.innerHTML = '<p>تعذر تحميل الوظائف، يرجى المحاولة لاحقاً.</p>';
      alert(`Error fetching jobs: ${err.message}`);
    });

  // Event Listener Setup
  jobs_list.addEventListener('click', (e) => {
    if (e.target.classList.contains('apply_btn')) {
      const job_id = e.target.getAttribute('data-job-id');
      try {
        open_offer_modal(job_id);
      } catch (err) {
        alert(`خطأ أثناء التقديم: ${err.message}`);
      }
    }
  });

}

