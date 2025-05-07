// client_view_offers_controller.js 

import { get_user_from_local_storage } from './model.js';

const client_id = get_user_from_local_storage().id;
const offers_container = document.getElementById("offers_container");

function load_client_jobs_and_offers() {
    firebase.database().ref("jobs").orderByChild("client_id").equalTo(client_id).once("value", snapshot => {
        offers_container.innerHTML = "";
        if (!snapshot.exists()) {
            offers_container.innerHTML = "<p>لا توجد طلبات حالياً.</p>";
            return;
        }
        snapshot.forEach(jobSnap => {
            const job = jobSnap.val();
            const job_id = jobSnap.key;
            const job_div = document.createElement("div");
            job_div.className = "job";
            job_div.innerHTML = `
                                <h3>${job.title}</h3>
                                <p>${job.details}</p>
                                <div id="offers_${job_id}">تحميل العروض...</div>
                                `;
            offers_container.appendChild(job_div);
            load_offers_for_job(job_id);
        });
    });
}

function load_offers_for_job(job_id) {
    const offers_div = document.getElementById(`offers_${job_id}`);
    firebase.database().ref(`offers/${job_id}`).once("value", snapshot => {
        offers_div.innerHTML = "";
        if (!snapshot.exists()) {
            offers_div.innerHTML = "<p>لا يوجد عروض حتى الآن.</p>";
            return;
        }
        snapshot.forEach(offer_snap => {
            const offer = offer_snap.val();
            const offer_id = offer_snap.key;
            const offer_element = document.createElement("div");
            offer_element.className = "offer";
            offer_element.innerHTML = `
                                <p>معرف المندوب: ${offer.courier_id}</p>
                                <p>تاريخ العرض: ${new Date(offer.offered_at).toLocaleString()}</p>
                                <p>الحالة: ${offer.status}</p>
                                ${offer.status === "pending" ? `<button onclick="accept_offer('${job_id}', '${offer_id}', '${offer.courier_id}')">قبول العرض</button>` : ''}
                                `;
            offers_div.appendChild(offer_element);
        });
    });
}

window.accept_offer = function (job_id, offer_id, courier_id) {
    firebase.database().ref(`offers/${job_id}/${offer_id}/status`).set("accepted");
    firebase.database().ref(`jobs/${job_id}`).update({
        status: "assigned",
        courierId: courier_id
    });
    alert("تم قبول العرض بنجاح!");
    load_client_jobs_and_offers();
}

load_client_jobs_and_offers();
