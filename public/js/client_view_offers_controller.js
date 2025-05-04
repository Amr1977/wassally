// client_view_offers_controller.js 

import { initialize_firebase_app, get_database, get_user_from_local_storage } from './model.js';
import { add_log, get_logs, clear_logs } from "./indexeddb_logs.js";

document.addEventListener('DOMContentLoaded', () => {
    const clientId = get_user_from_local_storage().id;
    const offers_container = document.getElementById("offers_container");

    function load_client_jobs_and_offers() {
        get_database().ref("jobs").orderByChild("clientId").equalTo(clientId).once("value", snapshot => {
            offers_container.innerHTML = "";
            if (!snapshot.exists()) {
                offers_container.innerHTML = "<p>لا توجد طلبات حالياً.</p>";
                return;
            }
            snapshot.forEach(jobSnap => {
                const job = jobSnap.val();
                const jobId = jobSnap.key;
                const jobDiv = document.createElement("div");
                jobDiv.className = "job";
                jobDiv.innerHTML = `
                                    <h3>${job.title}</h3>
                                    <p>${job.details}</p>
                                    <div id="offers_${jobId}">تحميل العروض...</div>
                                    `;
                offers_container.appendChild(jobDiv);
                load_offers_for_job(jobId);
            });
        });
    }

    function load_offers_for_job(jobId) {
        const offersDiv = document.getElementById(`offers_${jobId}`);
        get_database().ref(`offers/${jobId}`).once("value", snapshot => {
            offersDiv.innerHTML = "";
            if (!snapshot.exists()) {
                offersDiv.innerHTML = "<p>لا يوجد عروض حتى الآن.</p>";
                return;
            }
            snapshot.forEach(offerSnap => {
                const offer = offerSnap.val();
                const offerId = offerSnap.key;
                const offerEl = document.createElement("div");
                offerEl.className = "offer";
                offerEl.innerHTML = `
                                    <p>معرف المندوب: ${offer.courierId}</p>
                                    <p>تاريخ العرض: ${new Date(offer.offeredAt).toLocaleString()}</p>
                                    <p>الحالة: ${offer.status}</p>
                                    ${offer.status === "pending" ? `<button onclick="acceptOffer('${jobId}', '${offerId}', '${offer.courierId}')">قبول العرض</button>` : ''}
                                    `;
                offersDiv.appendChild(offerEl);
            });
        });
    }

    window.acceptOffer = function (jobId, offerId, courierId) {
        get_database().ref(`offers/${jobId}/${offerId}/status`).set("accepted");
        get_database().ref(`jobs/${jobId}`).update({
            status: "assigned",
            courierId: courierId
        });
        alert("تم قبول العرض بنجاح!");
        load_client_jobs_and_offers();
    }

    load_client_jobs_and_offers();
});