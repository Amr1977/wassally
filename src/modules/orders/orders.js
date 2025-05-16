// orders.js
import { firestore } from "./firebase";
import { designatePrimaryCourier } from "./courier";
import { getReservedAmountForCustomer, getReservedAmountForOrder } from "./utils";

/**
 * Create a new order.
 * Expects orderData to include: customer_id, pickup_location, dropoff_location, needed_budget,
 * required_couriers, and other order attributes.
 */
export async function createOrder(orderData) {
  const orderRef = firestore.collection("orders").doc();
  const newOrder = {
    ...orderData,
    status: "open",
    accepted_couriers: [],
    offers: {},
    reviews: {}
  };
  // needed_budget represents the total upfront purchase cost.
  await orderRef.set(newOrder);
  return orderRef.id;
}

/**
 * Place a bid for an order.
 * This leverages the order's needed_budget (upfront purchase cost).
 */
export async function placeBid(orderId, courierId, bidAmount, bidMessage) {
  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new Error("Order not found");
  const orderData = orderDoc.data();

  // Use order.needed_budget as the upfront purchase cost.
  const upfrontPurchaseCost = Number(orderData.needed_budget) || 0;

  // Ensure dropoff_estimation exists; if not, that should be computed
  // (Assume getFastestRouteInfo is provided in utils.js)
  let dropoffEstimation = orderData.dropoff_estimation;
  if (!dropoffEstimation) {
    // You may import getFastestRouteInfo from utils
    import { getFastestRouteInfo } from "./utils";
    dropoffEstimation = await getFastestRouteInfo(orderData.pickup_location, orderData.dropoff_location);
    await orderRef.update({ dropoff_estimation: dropoffEstimation });
  }

  // Get courier details (for fee rate and waiting rate)
  const courierDoc = await firestore.collection("users").doc(courierId).get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();

  // Assume pickup_estimation is computed similarly:
  import { getFastestRouteInfo } from "./utils";
  const pickupEstimation = await getFastestRouteInfo(courierData.current_location, orderData.pickup_location);

  // Calculate estimated distance fee.
  const distanceKm = dropoffEstimation.distance / 1000;
  const estimatedDistanceFee = distanceKm * (courierData.fee_per_km || 0);

  // Final estimated cost includes the distance fee plus the upfront purchase cost.
  const finalEstimatedCost = estimatedDistanceFee + upfrontPurchaseCost;

  // Safety margin for waiting fees: 0.5 * courier.waiting_rate.
  const safetyMargin = 0.5 * (courierData.waiting_rate || 0);

  // For wallet-paid orders, check that customer wallet covers the bid cost.
  if (orderData.payment_mode && orderData.payment_mode.toLowerCase() === "wallet") {
    const totalEstimatedBidAmount = (finalEstimatedCost + safetyMargin) * (1 + 0.10); // SYSTEM_COMMISSION_RATE assumed as 10%
    const customerRef = firestore.collection("users").doc(orderData.customer_id);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists) throw new Error("Customer not found");
    const customerBalance = customerDoc.data().wallet_balance || 0;

    // Check reserved funds across pending orders.
    const reservedFunds = await getReservedAmountForCustomer(orderData.customer_id);
    const availableFunds = customerBalance - reservedFunds;

    if (totalEstimatedBidAmount > availableFunds) {
      throw new Error("Bid cannot be placed: Customer wallet funds insufficient.");
    }
  }

  // Assemble bid data.
  const bidData = {
    bid_amount: bidAmount,
    bid_message: bidMessage,
    pickup_estimation: pickupEstimation,
    dropoff_estimation: dropoffEstimation,
    estimated_distance_fee: estimatedDistanceFee,
    upfront_purchase_cost: upfrontPurchaseCost,
    final_estimated_cost: finalEstimatedCost,
    timestamp: Date.now()
  };

  await orderRef.update({
    [`offers.${courierId}`]: bidData
  });
}

/**
 * Accept a bid from a courier.
 * Captures courier’s initial location and adds them to the accepted_couriers list.
 * Once required couriers are reached, designate a primary courier.
 */
export async function acceptBid(orderId, courierId) {
  const orderRef = firestore.collection("orders").doc(orderId);
  const doc = await orderRef.get();
  if (!doc.exists) throw new Error("Order not found");
  const data = doc.data();
  let acceptedCouriers = data.accepted_couriers || [];

  if (!acceptedCouriers.includes(courierId)) {
    acceptedCouriers.push(courierId);
    // Generate a pickup PIN (assume this is defined in utils.js)
    import { generatePickupPin } from "./utils";
    const pickupPin = generatePickupPin();

    // Get courier initial location.
    const courierDoc = await firestore.collection("users").doc(courierId).get();
    if (!courierDoc.exists) throw new Error("Courier not found");
    const courierData = courierDoc.data();
    const initialLocation = courierData.current_location || null;

    // Update order document.
    await orderRef.update({
      accepted_couriers: acceptedCouriers,
      [`couriers.${courierId}`]: {
        pickup_pin: pickupPin,
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
        initial_location: initialLocation,
        is_primary: false
      }
    });
  }

  // When required count is reached, designate a primary courier.
  if (acceptedCouriers.length >= data.required_couriers) {
    await designatePrimaryCourier(orderId);
  }
}
