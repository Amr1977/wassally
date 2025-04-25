// controllers/courier_view_jobs_controller.js
import { db } from "../js/model.js";

window.onload = function () {
    load_jobs();
};

function load_jobs() {
    const jobs_list_element = document.getElementById("jobs_list");
    jobs_list_element.innerHTML = "";  // Clear previous content

    db.ref("jobs").orderByChild("status").equalTo("open").on("child_added", function (snapshot) {
        const job_data = snapshot.val();
        const job_element = document.createElement("div");

        job_element.innerHTML = `
            <h3>${job_data.title}</h3>
            <p>${job_data.description}</p>
            <p>Client: ${job_data.client_name}</p>
            <button onclick="apply_for_job('${snapshot.key}')">التقديم على الوظيفة</button>
            <hr>
        `;

        jobs_list_element.appendChild(job_element);
    });
}

window.apply_for_job = function (job_id) {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("يجب عليك تسجيل الدخول أولاً");
        return;
    }

    db.ref(`jobs/${job_id}`).update({
        status: "assigned",
        courier_id: user.id,
        courier_name: user.name
    }).then(() => {
        alert("تم التقديم على الوظيفة بنجاح!");
        window.location.reload();  // Refresh the page to reflect the changes
    }).catch(err => {
        alert("حدث خطأ: " + err.message);
    });
};