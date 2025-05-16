// send_offer_controller.js

import { Offer, save_offer } from "./send_offer_model.js";
import { get_user_from_local_storage } from "./model.js";

let insert_model_flag = false;

async function append_send_offer_modal() {
  await fetch("../send_offer_view.html")
    .then(response => response.text())
    .then(html => {
      if (!insert_model_flag) {
        document.body.insertAdjacentHTML("beforeend", html);
        insert_model_flag = true;
      }
    });
}

export function open_offer_modal(job_id) {
  document.getElementById("job_id").value = job_id;
  document.getElementById("offer_modal").classList.add("show");
  document.getElementById("offer_modal").style.display = "flex"; // Ensure it appears

}

export function close_offer_modal() {
  document.getElementById("offered_price").value = ""; // Reset price field
  document.getElementById("offer_message").value = ""; // Reset message field
  document.getElementById("job_id").value = ""; // Reset job ID
  document.getElementById("offer_modal").classList.remove("show");
  document.getElementById("offer_modal").style.display = "none"; // Hide when closed

}

document.addEventListener('DOMContentLoaded', async () => {
  await append_send_offer_modal();
  add_modal_actions();
});

function add_modal_actions() {
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
  
  //cancel button
  document.getElementById("offer_modal_close_button").addEventListener("click", function (event){
    close_offer_modal();
  })

  //offer_model_x_close
  document.getElementById("offer_model_x_close").addEventListener("click", function (event){
    close_offer_modal();
  })


}