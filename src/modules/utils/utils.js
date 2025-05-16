// utils.js

/**
 * Calculate the Haversine distance (in meters) between two geographic points.
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters.
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a 4-digit pickup PIN.
 */
export function generatePickupPin() {
  return Math.floor(Math.random() * 9000) + 1000;
}

/**
 * Get fastest route info between two locations.
 * (Simulating an API call; replace with actual API if needed.)
 */
export async function getFastestRouteInfo(origin, destination) {
  // For demonstration, we use the Haversine distance.
  const distance = getDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  // Assume an average speed of 15 m/s; compute duration.
  const duration = distance / 15;
  return { distance, duration };
}

/**
 * Helper: Returns total reserved funds for a given customer's wallet (aggregating pending orders).
 * This function iterates through orders and uses getReservedAmountForOrder.
 */
export async function getReservedAmountForCustomer(customerId) {
  const ordersSnapshot = await firestore.collection("orders")
    .where("customer_id", "==", customerId)
    .where("payment_mode", "==", "wallet")
    .where("status", "in", ["open", "in_progress"])
    .get();
    
  let totalReserved = 0;
  for (const orderDoc of ordersSnapshot.docs) {
    totalReserved += await getReservedAmountForOrder(orderDoc.id);
  }
  return totalReserved;
}

/**
 * Helper: Returns the reserved funds amount for one order based on its accepted bids.
 */
export async function getReservedAmountForOrder(orderId) {
  const orderDoc = await firestore.collection("orders").doc(orderId).get();
  if (!orderDoc.exists) return 0;
  const orderData = orderDoc.data();
  let totalReserved = 0;
  if (orderData.accepted_couriers && orderData.accepted_couriers.length > 0) {
    for (const courierId of orderData.accepted_couriers) {
      const bid = orderData.offers[courierId];
      if (bid) {
        // Assume waiting margin is 0.5 * courier.waiting_rate.
        // For simplicity, we'll add a fixed multiplier.
        const safetyMargin = 0.5; 
        const bidReserved = (bid.final_estimated_cost + safetyMargin) * (1 + 0.10); // 10% commission.
        totalReserved += bidReserved;
      }
    }
  }
  return totalReserved;
}
