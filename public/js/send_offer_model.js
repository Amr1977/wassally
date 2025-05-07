import { initialize_firebase_app } from "./model";

class Offer {
    constructor(job_id, courier_id, offered_price, offer_message, timestamp) {
        this.job_id = job_id;
        this.courier_id = courier_id;
        this.offered_price = offered_price;
        this.offer_message = offer_message;
        this.timestamp = timestamp;
    }
}

function save_offer(offer) {
    return firebase.database().ref(`offers/${offer.job_id}`).push(offer)
  .then(snapshot => console.log("Offer saved!", snapshot.key))
  .catch(error => console.error("Error saving offer:", error));
}

export {
    Offer,
    save_offer
}