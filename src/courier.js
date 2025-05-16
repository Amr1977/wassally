// courier.js
import { firestore } from "./firebase";
import { getDistance, generatePickupPin } from "./utils";

/**
 * Update courier location for live tracking.
 */
export async function updateCourierLocation(orderId, courierId, location) {
  const orderRef = firestore.collection("orders").doc(orderId);
  // For simplicity, update current_location. In practice, you might append to route_history.
  await orderRef.update({
    [`couriers.${courierId}.current_location`]: location
  });
}

/**
 * Designate the primary courier using:
 * courier_weight = 0.3 * courier_rate + 0.7 * courier_total_order_count
 */
export async function designatePrimaryCourier(orderId) {
  const orderDoc = await firestore.collection("orders").doc(orderId).get();
  if (!orderDoc.exists) throw new Error("Order not found");
  
  const orderData = orderDoc.data();
  let primaryCourierId = null;
  let maxWeight = -Infinity;
  
  if (orderData.accepted_couriers && orderData.accepted_couriers.length > 0) {
    for (const courierId of orderData.accepted_couriers) {
      const courierDoc = await firestore.collection("users").doc(courierId).get();
      if (!courierDoc.exists) continue;
      const courierData = courierDoc.data();
      // Calculate weight.
      const weight = 0.3 * (courierData.rating || 0) + 0.7 * (courierData.order_count || 0);
      if (weight > maxWeight) {
        maxWeight = weight;
        primaryCourierId = courierId;
      }
    }
  }
  if (primaryCourierId) {
    await firestore.collection("orders").doc(orderId).update({
      [`couriers.${primaryCourierId}.is_primary`]: true
    });
  }
  return primaryCourierId;
}

/**
 * Record pickup arrival time.
 */
export async function recordPickupArrival(orderId, courierId) {
  const orderRef = firestore.collection("orders").doc(orderId);
  const doc = await orderRef.get();
  if (!doc.exists) throw new Error("Order not found");
  const data = doc.data();
  const currentCourier = data.couriers && data.couriers[courierId];
  if (currentCourier && !currentCourier.pickup_arrival) {
    await orderRef.update({
      [`couriers.${courierId}.pickup_arrival`]: Date.now()
    });
  }
}

/**
 * Confirm pickup and record related information.
 */
export async function confirmPickup(orderId, courierId, packageImageUrl, vendorReceiptUrl, paidAmount) {
  const orderRef = firestore.collection("orders").doc(orderId);
  // Ensure pickup arrival is recorded first.
  await recordPickupArrival(orderId, courierId);
  
  const updatedDoc = await orderRef.get();
  const updatedData = updatedDoc.data();
  const pickupArrival = updatedData.couriers[courierId].pickup_arrival;
  const confirmationTime = Date.now();
  const waitingTime = Math.max(confirmationTime - pickupArrival - 300000, 0); // WAITING_TIMEOUT is 5 minutes
  
  await orderRef.update({
    [`couriers.${courierId}.pickup_confirmed`]: true,
    [`couriers.${courierId}.package_image_url`]: packageImageUrl,
    [`couriers.${courierId}.vendor_receipt_url`]: vendorReceiptUrl,
    [`couriers.${courierId}.paid_amount`]: paidAmount,
    [`couriers.${courierId}.waiting_time_pickup`]: waitingTime,
    [`couriers.${courierId}.pickup_confirmation_time`]: confirmationTime
  });
}

/**
 * Record dropoff arrival time.
 */
export async function recordDropoffArrival(orderId, courierId) {
  const orderRef = firestore.collection("orders").doc(orderId);
  const doc = await orderRef.get();
  if (!doc.exists) throw new Error("Order not found");
  const data = doc.data();
  const currentCourier = data.couriers && data.couriers[courierId];
  if (currentCourier && !currentCourier.dropoff_arrival) {
    await orderRef.update({
      [`couriers.${courierId}.dropoff_arrival`]: Date.now()
    });
  }
}

/**
 * Confirm dropoff and record data.
 */
export async function confirmDropoff(orderId, courierId, dropoffImageUrl, vendorReceiptUrl, paidAmount) {
  const orderRef = firestore.collection("orders").doc(orderId);
  await recordDropoffArrival(orderId, courierId);
  
  const updatedDoc = await orderRef.get();
  const updatedData = updatedDoc.data();
  const dropoffArrival = updatedData.couriers[courierId].dropoff_arrival;
  const confirmationTime = Date.now();
  const waitingTime = Math.max(confirmationTime - dropoffArrival - 300000, 0); // WAITING_TIMEOUT: 5 minutes
  
  await orderRef.update({
    [`couriers.${courierId}.dropoff_confirmed`]: true,
    [`couriers.${courierId}.dropoff_image_url`]: dropoffImageUrl,
    [`couriers.${courierId}.dropoff_vendor_receipt_url`]: vendorReceiptUrl,
    [`couriers.${courierId}.dropoff_paid_amount`]: paidAmount,
    [`couriers.${courierId}.waiting_time_dropoff`]: waitingTime,
    [`couriers.${courierId}.dropoff_confirmation_time`]: confirmationTime
  });
}
