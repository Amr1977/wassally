import { initializeFirebaseApp, getDatabase } from './model.js';

const app = initializeFirebaseApp();
const db = getDatabase();

document.addEventListener('DOMContentLoaded', () => {
    const clientId = localStorage.getItem("userId");
    const offersContainer = document.getElementById("offersContainer");

    function loadClientJobsAndOffers() {
        db.ref("jobs").orderByChild("clientId").equalTo(clientId).once("value", snapshot => {
            offersContainer.innerHTML = "";
            if (!snapshot.exists()) {
                offersContainer.innerHTML = "<p>لا توجد طلبات حالياً.</p>";
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
                offersContainer.appendChild(jobDiv);
                loadOffersForJob(jobId);
            });
        });
    }

    function loadOffersForJob(jobId) {
        const offersDiv = document.getElementById(`offers_${jobId}`);
        db.ref(`offers/${jobId}`).once("value", snapshot => {
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
        db.ref(`offers/${jobId}/${offerId}/status`).set("accepted");
        db.ref(`jobs/${jobId}`).update({
            status: "assigned",
            courierId: courierId
        });
        alert("تم قبول العرض بنجاح!");
        loadClientJobsAndOffers();
    }

    loadClientJobsAndOffers();
});