import { Offer, save_offer } from "./send_offer_model.js";
import { get_user_from_local_storage } from "./model.js";

export function open_offer_modal(job_id) {
    document.getElementById("job_id").value = job_id;
    document.getElementById("offer_modal").style.display = "block";
}

function close_offer_modal() {
    document.getElementById("offered_price").value = ""; // Reset price field
    document.getElementById("offer_message").value = ""; // Reset message field
    document.getElementById("job_id").value = ""; // Reset job ID
    document.getElementById("offer_modal").style.display = "none";
}

document.addEventListener('DOMContentLoaded', async () => {
    // Attach event listener for submitting an offer
    document.getElementById("offer_form").addEventListener("submit", function (event) {
        event.preventDefault();

        const job_id = document.getElementById("job_id").value;
        const offered_price = document.getElementById("offered_price").value;
        const offer_message = document.getElementById("offer_message").value;
        const courier_id = get_user_from_local_storage().id; // Assuming session tracking

        const new_offer = new Offer(job_id, courier_id, offered_price, offer_message, Date.now());
        save_offer(new_offer).then(() => {
            alert("Offer submitted!");
            close_offer_modal();
        });
    });
});

