// badr_delivery_platform_model.js
// Badr Delivery Platform Model
// -----------------------------------------------------
// This file implements order creation, bid handling (with upfront purchase cost at order level), 
// pickup/dropoff confirmations, wallet transactions, fee management, primary courier 
// designation for both cash and wallet orders, order filtering, and multi-language notifications
// with dynamic localization via API translation and caching.
// -----------------------------------------------------

// -----------------------------------------------------
// Constants & Global Variables
// -----------------------------------------------------
const SYSTEM_COMMISSION_RATE = 0.10;      // 10% commission
const WAITING_TIMEOUT = 300000;           // 5 minutes in milliseconds
const CASH_BLOCK = -100;                  // If courier wallet falls below this, they see only wallet orders

// Global variables for live tracking.
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
  const R = 6371000; // Earth's radius in meters.
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
 * Get fastest route information (distance in meters and duration in seconds) between two points
 * using the Google Maps Distance Matrix API.
 */
async function get_fastest_route_info(origin, destination) {
  const api_key = 'YOUR_API_KEY'; // Replace with your actual API key.
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
        distance: data.rows[0].elements[0].distance.value,  // in meters
        duration: data.rows[0].elements[0].duration.value   // in seconds
      };
    } else {
      throw new Error("API response not OK");
    }
  } catch (error) {
    console.error("Error in get_fastest_route_info:", error);
    // Fallback: compute Haversine distance with an assumed average speed (15 m/s).
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
 *   - package_details, payment_method, needed_budget (upfront purchase cost), required_couriers, max_pickup_distance, etc.
 */
async function create_order(order_data) {
  const order_ref = firestore.collection("orders").doc();
  const new_order = {
    ...order_data,
    status: "open",
    accepted_couriers: [],
    offers: {},
    reviews: {}
    // order.needed_budget represents the total upfront purchase cost.
  };
  await order_ref.set(new_order);
  return order_ref.id;
}

/**
 * Place a bid for an order.
 * For wallet-paid orders, before saving the bid, we validate that the customer has enough funds.
 * We use the order's needed_budget as the upfront purchase cost.
 */
async function place_bid(order_id, courier_id, bid_amount, bid_message) {
  const order_ref = firestore.collection("orders").doc(order_id);
  const order_doc = await order_ref.get();
  if (!order_doc.exists) throw new Error("Order not found");
  const order_data = order_doc.data();
  
  // For consistency, use order.needed_budget as the upfront purchase cost.
  const upfront_purchase_cost = Number(order_data.needed_budget) || 0;

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

  // Calculate pickup_estimation from courier's current location to pickup point.
  const pickup_estimation = await get_fastest_route_info(courier_data.current_location, order_data.pickup_location);

  // Calculate estimated distance fee from dropoff_estimation.
  const distance_km = dropoff_estimation.distance / 1000;
  const estimated_distance_fee = distance_km * (courier_data.fee_per_km || 0);

  // Final estimated cost includes distance fee plus the upfront purchase cost from order.
  const final_estimated_cost = estimated_distance_fee + upfront_purchase_cost;

  // Compute a safety margin (for possible waiting fees; here defined as 0.5 * courier.waiting_rate).
  const safetyMargin = 0.5 * (courier_data.waiting_rate || 0);

  // For wallet-paid orders, check that the customer’s wallet can cover the bid cost.
  if (order_data.payment_mode && order_data.payment_mode.toLowerCase() === "wallet") {
    // Total estimated bid cost = (final_estimated_cost + safetyMargin) * (1 + SYSTEM_COMMISSION_RATE).
    const total_estimated_bid_amount = (final_estimated_cost + safetyMargin) * (1 + SYSTEM_COMMISSION_RATE);
    
    // Retrieve customer's wallet balance.
    const customer_ref = firestore.collection("users").doc(order_data.customer_id);
    const customer_doc = await customer_ref.get();
    if (!customer_doc.exists) throw new Error("Customer not found");
    const customer_balance = customer_doc.data().wallet_balance || 0;
    
    // Also consider funds already reserved.
    const reserved_for_customer = await get_reserved_amount_for_customer(order_data.customer_id);
    const availableFunds = customer_balance - reserved_for_customer;
    
    if (total_estimated_bid_amount > availableFunds) {
      notify_customer(
        order_data.customer_id,
        `A bid totaling ${total_estimated_bid_amount.toFixed(2)} was blocked due to insufficient wallet funds.`,
        `تم حظر عرض بقيمة ${total_estimated_bid_amount.toFixed(2)} لعدم كفاية رصيد المحفظة.`
      );
      throw new Error("Bid cannot be placed: Customer wallet funds insufficient.");
    }
  }

  // Assemble bid data.
  const bid_data = {
    bid_amount,
    bid_message,
    pickup_estimation,       // { distance, duration }
    dropoff_estimation,      // { distance, duration }
    estimated_distance_fee,  // Fee computed by distance.
    upfront_purchase_cost,   // Order-level upfront purchase cost.
    final_estimated_cost,    // Total cost = distance fee + upfront purchase cost.
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
 * Helper: Returns total reserved funds for a customer across pending wallet-paid orders.
 */
async function get_reserved_amount_for_customer(customer_id) {
  const ordersSnapshot = await firestore.collection("orders")
    .where("customer_id", "==", customer_id)
    .where("payment_mode", "==", "wallet")
    .where("status", "in", ["open", "in_progress"])
    .get();
    
  let totalReserved = 0;
  for (const orderDoc of ordersSnapshot.docs) {
    totalReserved += await get_reserved_amount_for_order(orderDoc.id);
  }
  return totalReserved;
}

/**
 * Helper: Returns reserved amount for a given order based on accepted bids.
 */
async function get_reserved_amount_for_order(order_id) {
  const orderDoc = await firestore.collection("orders").doc(order_id).get();
  if (!orderDoc.exists) return 0;
  const orderData = orderDoc.data();
  let totalReserved = 0;
  if (orderData.accepted_couriers && orderData.accepted_couriers.length > 0) {
    for (const courierId of orderData.accepted_couriers) {
      const bid = orderData.offers[courierId];
      if (bid) {
        const courierDoc = await firestore.collection("users").doc(courierId).get();
        const courierData = courierDoc.data() || {};
        const safetyMargin = 0.5 * (courierData.waiting_rate || 0);
        const bidReserved = (bid.final_estimated_cost + safetyMargin) * (1 + SYSTEM_COMMISSION_RATE);
        totalReserved += bidReserved;
      }
    }
  }
  return totalReserved;
}

/**
 * Accept a bid from a courier.
 * Captures the courier’s initial location and adds them to accepted list.
 * Once the required number of couriers is reached, designates a primary courier
 * (for both cash and wallet orders) using a weighted formula.
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

    // Capture courier's current location.
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
         initial_location,
         is_primary: false  // default flag for primary courier
      }
    });

    notify_courier(
      courier_id,
      `Your bid has been accepted. Your pickup PIN is: ${pickup_pin}`,
      `تم قبول عرضك. رقم الاستلام الخاص بك هو: ${pickup_pin}`
    );
  }

  // Once the required number of couriers has been accepted:
  if (accepted_couriers.length >= data.required_couriers) {
    await order_ref.update({ status: "in_progress", bid_expired: true });
    // Designate primary courier for both cash and wallet orders.
    await designate_primary_courier(order_id);
    // Notify non-selected bids.
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
 * Designate the primary courier for an order based on their courier weight.
 * courier_weight = 0.3 * courier_rate + 0.7 * courier_total_order_count.
 * The courier with the maximum weight is marked as primary.
 */
async function designate_primary_courier(order_id) {
  const orderDoc = await firestore.collection("orders").doc(order_id).get();
  if (!orderDoc.exists) throw new Error("Order not found");
  
  const orderData = orderDoc.data();
  let primaryCourierId = null;
  let maxWeight = -Infinity;
  
  if (orderData.accepted_couriers && orderData.accepted_couriers.length > 0) {
    for (const courierId of orderData.accepted_couriers) {
      const courierDoc = await firestore.collection("users").doc(courierId).get();
      if (!courierDoc.exists) continue;
      const courierData = courierDoc.data();
      // Calculate courier weight.
      const courier_weight =
        0.3 * (courierData.rating || 0) +
        0.7 * (courierData.order_count || 0);
      if (courier_weight > maxWeight) {
        maxWeight = courier_weight;
        primaryCourierId = courierId;
      }
    }
  }
  
  if (primaryCourierId) {
    await firestore.collection("orders").doc(order_id).update({
      [`couriers.${primaryCourierId}.is_primary`]: true
    });
  }
  return primaryCourierId;
}

/**
 * Update the courier's current location for live tracking.
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

async function get_courier_wallet_balance(courier_id) {
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) return 0;
  const courier_data = courier_doc.data();
  return courier_data.wallet_balance || 0;
}

async function get_system_wallet_balance() {
  const doc = await firestore.collection("system_wallet").doc("wallet").get();
  if (!doc.exists) return 0;
  const data = doc.data();
  return data.balance || 0;
}

async function transfer_fees_to_system_wallet(order_id, courier_id, fee_amount) {
  const courierRef = firestore.collection("users").doc(courier_id);
  const courierDoc = await courierRef.get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();
  const currentBalance = courierData.wallet_balance || 0;
  if (currentBalance < fee_amount) {
    throw new Error("Insufficient wallet balance for fee transfer");
  }
  await courierRef.update({ wallet_balance: currentBalance - fee_amount });

  const systemWalletRef = firestore.collection("system_wallet").doc("wallet");
  const systemWalletDoc = await systemWalletRef.get();
  let systemBalance = 0;
  if (systemWalletDoc.exists) {
    systemBalance = systemWalletDoc.data().balance || 0;
  }
  await systemWalletRef.set({ balance: systemBalance + fee_amount }, { merge: true });

  await firestore.collection("wallet_transactions").doc(courier_id).update({
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "platform_fee_transfer",
      amount: fee_amount,
      order_id: order_id,
      timestamp: Date.now()
    })
  });
  
  return { success: true, deducted: fee_amount };
}

/**
 * Finalize the order for a courier.
 * For wallet-paid orders, the system deducts the total customer charge from the customer's wallet,
 * credits the courier's wallet with the full courier fee (including their share of the upfront purchase cost),
 * and adds the platform fee to the system wallet.
 *
 * Calculation:
 *   - Total route distance = pickup_estimation.distance + dropoff_estimation.distance.
 *   - distance_fee = total_distance_in_km * courierData.fee_per_km.
 *   - courier_fee = distance_fee + waiting_fee_pickup + waiting_fee_dropoff + upfront_purchase_cost.
 *   - platform_fee = SYSTEM_COMMISSION_RATE * courier_fee.
 *   - total_customer_charge = courier_fee + platform_fee.
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
  
  const bidData = orderData.offers ? orderData.offers[courier_id] : null;
  if (!bidData) throw new Error("Bid data not found for courier");
  
  const pickup_distance = bidData.pickup_estimation.distance || 0;  // in meters
  const dropoff_distance = bidData.dropoff_estimation.distance || 0;  // in meters
  const total_distance_m = pickup_distance + dropoff_distance;
  const distance_in_km = total_distance_m / 1000;
  
  const courierDoc = await firestore.collection("users").doc(courier_id).get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();
  
  const distance_fee = distance_in_km * (courierData.fee_per_km || 0);
  const upfront_purchase_cost = bidData.upfront_purchase_cost || 0;
  
  const courier_fee = distance_fee + waiting_fee_pickup + waiting_fee_dropoff + Number(upfront_purchase_cost);
  const platform_fee = courier_fee * SYSTEM_COMMISSION_RATE;
  const total_customer_charge = courier_fee + platform_fee;
  
  if (orderData.payment_mode && orderData.payment_mode.toLowerCase() === "wallet") {
    const customerRef = firestore.collection("users").doc(orderData.customer_id);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists) throw new Error("Customer not found");
    const customerData = customerDoc.data();
    const customerBalance = customerData.wallet_balance || 0;
    if (customerBalance < total_customer_charge) {
      throw new Error("Insufficient funds in customer wallet");
    }
    await customerRef.update({ wallet_balance: customerBalance - total_customer_charge });
    await firestore.collection("wallet_transactions").doc(orderData.customer_id).update({
      transactions: firebase.firestore.FieldValue.arrayUnion({
        type: "order_payment",
        amount: total_customer_charge,
        order_id: order_id,
        timestamp: Date.now()
      })
    });

    const currentCourierBalance = courierData.wallet_balance || 0;
    await firestore.collection("users").doc(courier_id).update({
      wallet_balance: currentCourierBalance + courier_fee
    });
    await firestore.collection("wallet_transactions").doc(courier_id).update({
      transactions: firebase.firestore.FieldValue.arrayUnion({
        type: "order_credit",
        amount: courier_fee,
        order_id: order_id,
        timestamp: Date.now()
      })
    });
    
    await transfer_fees_to_system_wallet(order_id, courier_id, platform_fee);
  } else {
    const transferResult = await transfer_fees_to_system_wallet(order_id, courier_id, platform_fee);
  }
  
  await orderRef.update({
    [`couriers.${courier_id}.finalized`]: true,
    [`couriers.${courier_id}.receipt`]: {
      distance_fee: distance_fee,
      waiting_fee_pickup: waiting_fee_pickup,
      waiting_fee_dropoff: waiting_fee_dropoff,
      upfront_purchase_cost: Number(upfront_purchase_cost),
      courier_fee: courier_fee,
      platform_fee: platform_fee,
      total_customer_charge: total_customer_charge,
      finalized_at: Date.now()
    }
  });
  
  notify_courier(
    courier_id,
    "Order finalized. Your fee has been credited and, for wallet orders, payment has been processed from the customer's wallet.",
    "تم إنهاء الطلب. تم إضافة رسومك إلى محفظتك وتم خصم المبلغ المستحق من محفظة العميل."
  );
  
  return { 
    success: true, 
    platform_fee: platform_fee, 
    total_customer_charge: total_customer_charge
  };
}

// -----------------------------------------------------
// Customer Wallet Function
// -----------------------------------------------------

async function deposit_to_customer_wallet(customer_id, deposit_amount) {
  const customer_ref = firestore.collection("users").doc(customer_id);
  const customer_doc = await customer_ref.get();
  if (!customer_doc.exists) throw new Error("Customer not found");
  const customer_data = customer_doc.data();
  const current_balance = customer_data.wallet_balance || 0;
  const new_balance = current_balance + deposit_amount;
  await customer_ref.update({ wallet_balance: new_balance });
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

async function get_affordable_orders(courier_id) {
  const courier_doc = await firestore.collection("users").doc(courier_id).get();
  if (!courier_doc.exists) return [];
  const courier_data = courier_doc.data();
  const available_budget = courier_data.available_budget || 0;
  const courier_max_distance = courier_data.max_pickup_distance;
  const courier_current_location = courier_data.current_location;
  const wallet_balance = courier_data.wallet_balance || 0;
  
  let orders_snapshot = await firestore.collection("orders").where("status", "==", "open").get();
  let orders = orders_snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  if (wallet_balance < CASH_BLOCK) {
    orders = orders.filter(order => order.payment_mode && order.payment_mode.toLowerCase() === "wallet");
  }
  
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
// Localization Functions
// -----------------------------------------------------

/**
 * Get a localized translation for a given key and default text.
 * Checks if a translation for the target language is cached in Firestore's "translation_cache" collection.
 * If not, calls translateAPI to get the translation and caches it.
 */
async function getLocalizedText(key, defaultText, targetLanguage) {
  const docId = `${targetLanguage}_${key}`;
  const cacheDoc = await firestore.collection("translation_cache").doc(docId).get();
  if (cacheDoc.exists) {
    const data = cacheDoc.data();
    if (data && data.translation) {
      return data.translation;
    }
  }
  // Translation not in cache—call the translation API.
  const translatedText = await translateAPI(defaultText, targetLanguage);
  // Cache the translation.
  await firestore.collection("translation_cache").doc(docId).set({
    translation: translatedText
  });
  return translatedText;
}

/**
 * Dummy translateAPI function.
 * Replace with an actual API call to a translation service (e.g. Google Translate API) in production.
 */
async function translateAPI(text, targetLanguage) {
  //TODO do it!
  // For demo purposes, simulate translation by appending a suffix.
  return `${text} [${targetLanguage} translation]`;
}

/**
 * An enhanced voice notification that uses localization.
 */
async function play_localized_voice_notification(user_id, defaultMessageEn, defaultMessageAr) {
  const user_doc = await firestore.collection("users").doc(user_id).get();
  const language = (user_doc.exists && user_doc.data().language) ? user_doc.data().language : 'en';
  
  let message = defaultMessageEn; // default
  if (language !== 'en') {
    if (language === 'ar') {
      // Use the provided Arabic message if available.
      message = defaultMessageAr || defaultMessageEn;
    } else {
      // For other languages, get translation using our localization API.
      // Generate a key from the default message (this is a simplified approach).
      const key = defaultMessageEn.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      message = await getLocalizedText(key, defaultMessageEn, language);
    }
  }
  
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(message);
  // Set language code: for Arabic use ar-SA, otherwise use the language code.
  utterance.lang = (language === 'ar') ? 'ar-SA' : language;
  utterance.volume = 1;
  synth.speak(utterance);
}

/**
 * Notify a courier using localized voice notification.
 */
function notify_courier(courier_id, message_en, message_ar = message_en) {
  play_localized_voice_notification(courier_id, message_en, message_ar);
}

/**
 * Notify a customer using localized voice notification.
 */
function notify_customer(customer_id, message_en, message_ar = message_en) {
  play_localized_voice_notification(customer_id, message_en, message_ar);
}

// -------------------
// Exports from badr_delivery_platform_model.js
// -------------------

export {
  SYSTEM_COMMISSION_RATE,
  WAITING_TIMEOUT,
  CASH_BLOCK,
  last_location,
  last_update_time,
  get_haversine_distance,
  generate_pickup_pin,
  create_order,
  place_bid,
  accept_bid,
  update_courier_location,
  confirm_pickup,
  confirm_dropoff,
  finalize_order,
  notify_courier,
  notify_customer
};

// -----------------------------------------------------
// End of Badr Delivery Platform Model Code
// -----------------------------------------------------
