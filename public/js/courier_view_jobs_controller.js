// courier_view_jobs_controller.js
import {
    db,
    getUserFromLocalStorage
} from "../js/model.js";

import {
    ref,
    query,
    orderByChild,
    equalTo,
    onChildAdded,
    get,
    update
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// لو حبيت تستخدم Firebase Auth بعدين:
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

window.onload = function () {
    load_jobs();
};

function load_jobs() {
    const jobs_list_element = document.getElementById("jobs_list");
    jobs_list_element.innerHTML = "<p>جاري تحميل الوظائف...</p>";

    const jobsRef = query(ref(db, "jobs"), orderByChild("status"), equalTo("open"));
    onChildAdded(jobsRef, (snapshot) => {
        if (jobs_list_element.innerHTML.includes("جاري تحميل الوظائف")) {
            jobs_list_element.innerHTML = "";
        }
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

window.apply_for_job = async function (job_id) {
    const user = getUserFromLocalStorage();
    if (!user) {
        alert("يجب عليك تسجيل الدخول أولاً");
        return;
    }

    const jobRef = ref(db, `jobs/${job_id}`);
    try {
        const snapshot = await get(jobRef);
        const job = snapshot.val();
        if (job.status !== "open") {
            alert("هذه الوظيفة لم تعد متاحة");
            return;
        }
        await update(jobRef, {
            status: "assigned",
            courier_id: user.id,
            courier_name: user.name
        });
        alert("تم التقديم على الوظيفة بنجاح!");
        window.location.reload();
    } catch (err) {
        alert("حدث خطأ: " + err.message);
    }
};