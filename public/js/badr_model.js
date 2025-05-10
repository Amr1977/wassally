// badr_delivery_platform_model.js
// Badr Delivery Platform Model
// This file implements order creation, bid handling, pickup/dropoff confirmation,
// wallet transactions, fee management, and notifications for the delivery platform.

// -----------------------------------------------------
// Constants & Global Variables
// -----------------------------------------------------
const SYSTEM_COMMISSION_RATE = 0.10;      // 10% commission
const WAITING_TIMEOUT = 300000;           // 5 minutes in milliseconds
const CASH_BLOCK = -100;                  // If courier wallet goes below this, they see only wallet-paid orders

// Global variables for live tracking (these may be improved later)
let last_location = { lat: null, lng: null };
let last_update_time = Date.now();

// -----------------------------------------------------
// Helper Functions
// -----------------------------------------------------

/**
 * Calculate the Haversine distance (in meters) between two coordinates.
 */
function get_haversine_distance(lat1, lng1, lat2, lng2) {
  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) return Infinity;
  const to_rad = x => x * Math.PI / 180;
  const R = 6371000; // Earth's radius in meters
  const d_lat = to_rad(lat2 - lat1);
  const d_lng = to_rad(lng2 - lng1);
  const a =
    Math.sin(d_lat / 2) ** 2 +
    Math.cos(to_rad(lat1)) * Math.cos(to_rad(lat2)) *
    Math.sin(d_lng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get the fastest route information (distance in meters and duration in seconds)
 * between two points using the Google Maps Distance Matrix API.
 */
async function get_fastest_route_info(origin, destination) {
  const api_key = 'YOUR_API_KEY'; // Replace with your actual Google Maps API key.
  const origin_str = `${origin.lat},${origin.lng}`;
  const destination_str = `${destination.lat},${destination.lng}`;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin_str}&destinations=${destination_str}&key=${api_key}&departure_time=now`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (
      data.status === "OK" &&
      data.rows &&
      data.rows[0] &&
      data.rows[0].elements[0] &&
      data.rows[0].elements[0].status === "OK"
    ) {
      return {
        distance: data.rows[0].elements[0].distance.value, // in meters
        duration: data.rows[0].elements[0].duration.value  // in seconds
      };
    } else {
      throw new Error("API response not OK");
    }
  } catch (error) {
    console.error("Error in get_fastest_route_info:", error);
    // Fallback: use Haversine distance with an assumed average speed of 15 m/s.
    const distance = get_haversine_distance(origin.lat, origin.lng, destination.lat, destination.lng);
    const average_speed = 15;
    const duration = distance / average_speed;
    return { distance, duration };
  }
}

/**
 * Generate a 4-digit pickup PIN.
 */
function generate_pickup_pin() {
  return Math.floor(Math.random() * 9000) + 1000;
}

// -----------------------------------------------------
// Order & Bid Functions
// -----------------------------------------------------

/**
 * Create a new order.
 * order_data must include:
 *   - customer_id,
 *   - pickup_location: { lat, lng, address, phone_number },
 *   - dropoff_location: { lat, lng, address, phone_number },
 *   - package_details, payment_method, needed_budget, required_couriers, max_pickup_distance, etc.
 */
async function create_order(order_data) {
  const order_ref = firestore.collection("orders").doc();
  const new_order = {
    ...order_data,
    status: "open",
    accepted_couriers: [],
    offers: {},
    reviews: {}
    // dropoff_estimation can be calculated later when needed.
  };
  await order_ref.set(new_order);
  return order_ref.id;
}

/**
 * Place a bid for an order.
 * Calculates:
 *   - pickup_estimation: route from courier's current location to pickup.
 *   - dropoff_estimation: route from pickup to dropoff.
 * These estimations are stored in the bid data.
 */
async function place_bid(order_id, courier_id, bid_amount, bid_message) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const order_doc = await order_ref.get();
  if (!order_doc.exists) throw new Error("Order not found");
  const order_data = order_doc.data();
  
  // Ensure dropoff_estimation exists.
  let dropoff_estimation = order_data.dropoff_estimation;
  if (!dropoff_estimation) {
    dropoff_estimation = await get_fastest_route_info(order_data.pickup_location, order_data.dropoff_location);
    await order_ref.update({ dropoff_estimation });
  }
  
  // Get courier details.
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) throw new Error("Courier not found");
  const courier_data = courier_doc.data();
  
  // Calculate pickup_estimation from courier's current location to pickup.
  const pickup_estimation = await get_fastest_route_info(courier_data.current_location, order_data.pickup_location);
  
  // Estimated cost for display (using dropoff_estimation and courier's per km rate).
  const distance_km = dropoff_estimation.distance / 1000;
  const estimated_cost = distance_km * (courier_data.fee_per_km || 0);
  
  const bid_data = {
    bid_amount,
    bid_message,
    pickup_estimation,    // { distance, duration } in meters and seconds.
    dropoff_estimation,   // { distance, duration }
    estimated_cost,
    timestamp: Date.now()
  };
  
  await order_ref.update({
    [`offers.${courier_id}`]: bid_data
  });
  
  notify_courier(
    courier_id,
    "Your bid has been placed with estimated pickup & dropoff details.",
    "تم تقديم عرضك بنجاح مع تقديرات زمن ومسافة الاستلام والتسليم."
  );
  notify_customer(
    order_data.customer_id,
    "A new bid has been placed.",
    "تم تقديم عرض جديد."
  );
}

/**
 * Accept a bid from a courier.
 * Generates a unique pickup PIN and saves the courier's initial location (at acceptance time).
 */
async function accept_bid(order_id, courier_id) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const doc = await order_ref.get();
  if (!doc.exists) throw new Error("Order not found");
  const data = doc.data();
  let accepted_couriers = data.accepted_couriers || [];
  
  if (!accepted_couriers.includes(courier_id)) {
    accepted_couriers.push(courier_id);
    const pickup_pin = generate_pickup_pin();
    
    // Fetch courier document to capture current location.
    const courier_doc = await firestore.collection("users").doc(courier_id).get();
    if (!courier_doc.exists) throw new Error("Courier not found");
    const courier_data = courier_doc.data();
    const initial_location = courier_data.current_location || null;
    
    await order_ref.update({
      accepted_couriers,
      [`couriers.${courier_id}`]: {
         pickup_pin,
         pickup_verified: false,
         pickup_arrival: null,
         pickup_confirmed: false,
         waiting_time_pickup: 0,
         waiting_fee_pickup: 0,
         dropoff_arrival: null,
         dropoff_confirmed: false,
         waiting_time_dropoff: 0,
         waiting_fee_dropoff: 0,
         finalized: false,
         initial_location
      }
    });
    
    notify_courier(
      courier_id,
      `Your bid has been accepted. Your pickup PIN is: ${pickup_pin}`,
      `تم قبول عرضك. رقم الاستلام الخاص بك هو: ${pickup_pin}`
    );
  }
  
  // If required number of couriers have been accepted, close bidding.
  if (accepted_couriers.length >= data.required_couriers) {
    await order_ref.update({ status: "in_progress", bid_expired: true });
    // Notify non-selected couriers.
    if (data.offers) {
      for (const bidCourierId in data.offers) {
        if (!accepted_couriers.includes(bidCourierId)) {
          notify_courier(
            bidCourierId,
            "Your bid has expired as the order has reached the required number of couriers.",
            "انتهى عرضك لأن الطلب بلغ العدد المطلوب من السائقين."
          );
        }
      }
    }
    notify_customer(
      data.customer_id,
      "Enough couriers have been accepted. Your order is now active!",
      "تم قبول العدد المطلوب من السائقين. طلبك الآن نشط!"
    );
  }
}

/**
 * Update the courier's current location (for live tracking).
 */
async function update_courier_location(order_id, courier_id, lat, lng) {
  const new_location = { lat, lng };
  const route_distance = get_haversine_distance(last_location.lat, last_location.lng, new_location.lat, new_location.lng);
  const time_elapsed = Date.now() - last_update_time;
  
  if (route_distance > 50 || time_elapsed > 60000) {
    last_location = new_location;
    last_update_time = Date.now();
    await firestore.collection("orders").doc(order_id).update({
      [`couriers.${courier_id}.current_location`]: new_location,
      [`couriers.${courier_id}.route_history`]:
          firebase.firestore.FieldValue.arrayUnion({ ...new_location, timestamp: Date.now() })
    });
  }
}

// -----------------------------------------------------
// Pickup & Dropoff Confirmation Functions
// -----------------------------------------------------

/**
 * Record pickup arrival time if not already recorded.
 */
async function record_pickup_arrival(order_id, courier_id) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const doc = await order_ref.get();
  if (!doc.exists) throw new Error("Order not found");
  const data = doc.data();
  const courierRecord = (data.couriers && data.couriers[courier_id]) || {};
  if (!courierRecord.pickup_arrival) {
    await order_ref.update({
      [`couriers.${courier_id}.pickup_arrival`]: Date.now()
    });
  }
}

/**
 * Confirm pickup. After uploading images and checking out at pickup,
 * calculates any additional waiting fees.
 */
async function confirm_pickup(order_id, courier_id, package_image_url, vendor_receipt_url, paid_amount) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const doc = await order_ref.get();
  if (!doc.exists) throw new Error("Order not found");
  const order_data = doc.data();
  const courierRecord = (order_data.couriers && order_data.couriers[courier_id]) || {};
  
  if (!courierRecord.pickup_arrival) {
    await record_pickup_arrival(order_id, courier_id);
  }
  
  const updatedDoc = await order_ref.get();
  const updatedData = updatedDoc.data();
  const pickup_arrival = updatedData.couriers[courier_id].pickup_arrival;
  const confirmation_time = Date.now();
  
  // Calculate waiting time beyond the standard timeout.
  let waiting_time = 0;
  if (confirmation_time - pickup_arrival > WAITING_TIMEOUT) {
    waiting_time = confirmation_time - pickup_arrival - WAITING_TIMEOUT;
  }
  
  await order_ref.update({
    [`couriers.${courier_id}.pickup_confirmed`]: true,
    [`couriers.${courier_id}.package_image_url`]: package_image_url,
    [`couriers.${courier_id}.vendor_receipt_url`]: vendor_receipt_url,
    [`couriers.${courier_id}.paid_amount`]: paid_amount,
    [`couriers.${courier_id}.waiting_time_pickup`]: waiting_time,
    [`couriers.${courier_id}.pickup_confirmation_time`]: confirmation_time
  });
  
  // Calculate waiting fee (assuming courier's waiting_rate is defined).
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) throw new Error("Courier not found");
  const courier_data = courier_doc.data();
  const waiting_fee = (waiting_time / 60000) * (courier_data.waiting_rate || 0);
  
  await order_ref.update({
    [`couriers.${courier_id}.waiting_fee_pickup`]: waiting_fee
  });
  
  notify_courier(
    courier_id,
    "Pickup confirmed with images and receipt.",
    "تم تأكيد استلام الطرد مع الصور والإيصال."
  );
  
  return { success: true, waiting_time, waiting_fee };
}

/**
 * Record dropoff arrival time if not already recorded.
 */
async function record_dropoff_arrival(order_id, courier_id) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const doc = await order_ref.get();
  if (!doc.exists) throw new Error("Order not found");
  const data = doc.data();
  const courierRecord = (data.couriers && data.couriers[courier_id]) || {};
  if (!courierRecord.dropoff_arrival) {
    await order_ref.update({
      [`couriers.${courier_id}.dropoff_arrival`]: Date.now()
    });
  }
}

/**
 * Confirm dropoff. Similar to confirm_pickup, records images and receipts,
 * and calculates waiting fees if beyond the timeout.
 */
async function confirm_dropoff(order_id, courier_id, dropoff_image_url, vendor_receipt_url, paid_amount) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const doc = await order_ref.get();
  if (!doc.exists) throw new Error("Order not found");
  const order_data = doc.data();
  const courierRecord = (order_data.couriers && order_data.couriers[courier_id]) || {};
  
  if (!courierRecord.dropoff_arrival) {
    await record_dropoff_arrival(order_id, courier_id);
  }
  
  const updatedDoc = await order_ref.get();
  const updatedData = updatedDoc.data();
  const dropoff_arrival = updatedData.couriers[courier_id].dropoff_arrival;
  const confirmation_time = Date.now();
  
  let waiting_time = 0;
  if (confirmation_time - dropoff_arrival > WAITING_TIMEOUT) {
    waiting_time = confirmation_time - dropoff_arrival - WAITING_TIMEOUT;
  }
  
  await order_ref.update({
    [`couriers.${courier_id}.dropoff_confirmed`]: true,
    [`couriers.${courier_id}.dropoff_image_url`]: dropoff_image_url,
    [`couriers.${courier_id}.dropoff_vendor_receipt_url`]: vendor_receipt_url,
    [`couriers.${courier_id}.dropoff_paid_amount`]: paid_amount,
    [`couriers.${courier_id}.waiting_time_dropoff`]: waiting_time,
    [`couriers.${courier_id}.dropoff_confirmation_time`]: confirmation_time
  });
  
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) throw new Error("Courier not found");
  const courier_data = courier_doc.data();
  const waiting_fee = (waiting_time / 60000) * (courier_data.waiting_rate || 0);
  
  await order_ref.update({
    [`couriers.${courier_id}.waiting_fee_dropoff`]: waiting_fee
  });
  
  notify_courier(
    courier_id,
    "Dropoff confirmed with images and receipt.",
    "تم تأكيد تسليم الطرد مع الصور والإيصال."
  );
  
  return { success: true, waiting_time, waiting_fee };
}

// -----------------------------------------------------
// Wallet & Fee Management Functions
// -----------------------------------------------------

/**
 * Get the courier's wallet balance.
 */
async function get_courier_wallet_balance(courier_id) {
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) return 0;
  const courier_data = courier_doc.data();
  return courier_data.wallet_balance || 0;
}

/**
 * Get the system wallet balance.
 * Assumes a single document with ID "wallet" in the "system_wallet" collection.
 */
async function get_system_wallet_balance() {
  const doc = await firestore.collection("system_wallet").doc("wallet").get();
  if (!doc.exists) return 0;
  const data = doc.data();
  return data.balance || 0;
}

/**
 * Transfer the platform fee from a courier's wallet to the system wallet.
 * Deducts fee_amount from the courier and adds it to the system wallet.
 */
async function transfer_fees_to_system_wallet(order_id, courier_id, fee_amount) {
  // Deduct fee_amount from courier's wallet.
  const courierRef = firestore.collection("users").doc(courier_id);
  const courierDoc = await courierRef.get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();
  const currentBalance = courierData.wallet_balance || 0;
  if (currentBalance < fee_amount) {
    throw new Error("Insufficient wallet balance for fee transfer");
  }
  await courierRef.update({ wallet_balance: currentBalance - fee_amount });
  
  // Add fee_amount to the system wallet.
  const systemWalletRef = firestore.collection("system_wallet").doc("wallet");
  const systemWalletDoc = await systemWalletRef.get();
  let systemBalance = 0;
  if (systemWalletDoc.exists) {
    systemBalance = systemWalletDoc.data().balance || 0;
  }
  await systemWalletRef.set({ balance: systemBalance + fee_amount }, { merge: true });
  
  // Record the transaction.
  await firestore.collection("wallet_transactions").doc(courier_id).update({
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "fee_transfer",
      amount: fee_amount,
      order_id: order_id,
      timestamp: Date.now()
    })
  });
  
  return { success: true, deducted: fee_amount };
}

/**
 * Finalize the order for a courier.
 * Uses the bid data (pickup_estimation and dropoff_estimation) already stored at bid time.
 * Calculation:
 *   - Total route distance = pickup_estimation.distance + dropoff_estimation.distance.
 *   - distance_fee = total_distance_in_km * courierData.fee_per_km.
 *   - courier_fee = distance_fee + waiting fees.
 *   - platform_fee = SYSTEM_COMMISSION_RATE * courier_fee.
 * The courier receives the full courier_fee;
 * only the platform_fee is deducted from their wallet.
 * The customer is charged: courier_fee + platform_fee.
 */
async function finalize_order(order_id, courier_id) {
  const orderRef = firestore.collection("orders").doc(order_id);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new Error("Order not found");
  const orderData = orderDoc.data();
  const courierRecord = (orderData.couriers && orderData.couriers[courier_id]);
  if (!courierRecord) throw new Error("Courier record not found in order");
  
  const waiting_fee_pickup = courierRecord.waiting_fee_pickup || 0;
  const waiting_fee_dropoff = courierRecord.waiting_fee_dropoff || 0;
  
  // Retrieve the stored bid data for this courier.
  const bidData = orderData.offers ? orderData.offers[courier_id] : null;
  if (!bidData) throw new Error("Bid data not found for courier");
  
  // Total route distance = pickup_estimation.distance + dropoff_estimation.distance.
  const pickup_distance = bidData.pickup_estimation.distance || 0;  // in meters
  const dropoff_distance = bidData.dropoff_estimation.distance || 0;  // in meters
  const total_distance_m = pickup_distance + dropoff_distance;
  const distance_in_km = total_distance_m / 1000;
  
  // Get courier's fee_per_km rate.
  const courierDoc = await firestore.collection("users").doc(courier_id).get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();
  
  // Calculate distance fee.
  const distance_fee = distance_in_km * (courierData.fee_per_km || 0);
  
  // Courier fee = distance_fee + waiting fees.
  const courier_fee = distance_fee + waiting_fee_pickup + waiting_fee_dropoff;
  
  // Platform fee is SYSTEM_COMMISSION_RATE * courier_fee.
  const platform_fee = courier_fee * SYSTEM_COMMISSION_RATE;
  
  // Total customer charge.
  const total_customer_charge = courier_fee + platform_fee;
  
  // Deduct only the platform fee from the courier's wallet.
  const transferResult = await transfer_fees_to_system_wallet(order_id, courier_id, platform_fee);
  
  // Update the order with an itemized receipt.
  await orderRef.update({
    [`couriers.${courier_id}.finalized`]: true,
    [`couriers.${courier_id}.receipt`]: {
      distance_fee: distance_fee,               // e.g., calculated from bid estimations.
      waiting_fee_pickup: waiting_fee_pickup,
      waiting_fee_dropoff: waiting_fee_dropoff,
      courier_fee: courier_fee,                 // Total courier earnings.
      platform_fee: platform_fee,               // Commission is 10% of courier_fee.
      total_customer_charge: total_customer_charge,
      finalized_at: Date.now()
    }
  });
  
  notify_courier(
    courier_id,
    "Order finalized. You receive your full fee; only the platform commission has been deducted.",
    "تم إنهاء الطلب. تحصل على كامل رسومك، وتم خصم عمولة المنصة من محفظتك فقط."
  );
  
  return { 
    success: true, 
    platform_fee: platform_fee, 
    total_customer_charge: total_customer_charge,
    transfer: transferResult 
  };
}

// -----------------------------------------------------
// Customer Wallet Function
// -----------------------------------------------------

/**
 * Deposit funds into a customer's wallet.
 * The customer transfers money to a dedicated system smart wallet number,
 * and once received, their wallet balance is updated.
 */
async function deposit_to_customer_wallet(customer_id, deposit_amount) {
  const customer_ref = firestore.collection("users").doc(customer_id);
  const customer_doc = await customer_ref.get();
  if (!customer_doc.exists) throw new Error("Customer not found");
  const customer_data = customer_doc.data();
  const current_balance = customer_data.wallet_balance || 0;
  const new_balance = current_balance + deposit_amount;
  
  await customer_ref.update({ wallet_balance: new_balance });
  
  // Record the deposit transaction
  await firestore.collection("wallet_transactions").doc(customer_id).update({
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "deposit",
      amount: deposit_amount,
      timestamp: Date.now()
    })
  });
  
  return { success: true, new_balance };
}

// -----------------------------------------------------
// Order Filtering for Couriers (Including Cash-Blocked Scenario)
// -----------------------------------------------------

/**
 * Get available orders for a courier.
 * If the courier's wallet_balance is below CASH_BLOCK, only return orders
 * with payment_mode set to "wallet" (i.e., digital payment orders).
 */
async function get_affordable_orders(courier_id) {
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) return [];
  const courier_data = courier_doc.data();
  const available_budget = courier_data.available_budget || 0;
  const courier_max_distance = courier_data.max_pickup_distance;
  const courier_current_location = courier_data.current_location;
  const wallet_balance = courier_data.wallet_balance || 0;
  
  // Retrieve "open" orders.
  let orders_snapshot = await firestore.collection("orders").where("status", "==", "open").get();
  let orders = orders_snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // If the courier is cash blocked (wallet_balance below CASH_BLOCK),
  // filter orders to only those that have payment_mode "wallet".
  if (wallet_balance < CASH_BLOCK) {
    orders = orders.filter(order => order.payment_mode &&
      order.payment_mode.toLowerCase() === "wallet");
  }
  
  // Further filtering based on budget and maximum pickup distance.
  orders = orders.filter(order => {
    if (order.needed_budget > available_budget) return false;
    if (!order.pickup_location) return false;
    const distance = get_haversine_distance(
      courier_current_location.lat,
      courier_current_location.lng,
      order.pickup_location.lat,
      order.pickup_location.lng
    );
    if (distance > courier_max_distance) return false;
    if (order.max_pickup_distance && distance > order.max_pickup_distance) return false;
    return true;
  });
  
  return orders;
}

// -----------------------------------------------------
// Notification Functions (Multi-Language)
// -----------------------------------------------------

/**
 * Play voice notification using the browser's speech synthesis.
 */
async function play_voice_notification(user_id, message_en, message_ar) {
  const user_doc = await firestore.collection("users").doc(user_id).get();
  const language = (user_doc.exists && user_doc.data().language) ? user_doc.data().language : "en";
  const message = (language === "ar") ? message_ar : message_en;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = language === "ar" ? "ar-SA" : "en-US";
  utterance.volume = 1;
  synth.speak(utterance);
}

function notify_courier(courier_id, message_en, message_ar = message_en) {
  play_voice_notification(courier_id, message_en, message_ar);
}

function notify_customer(customer_id, message_en, message_ar = message_en) {
  play_voice_notification(customer_id, message_en, message_ar);
}

// -----------------------------------------------------
// End of Badr Delivery Platform Model Code
// -----------------------------------------------------
