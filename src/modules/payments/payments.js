// payments.js
import { firestore } from "./firebase";

/**
 * Get the wallet balance for a courier.
 */
export async function getCourierWalletBalance(courierId) {
  const doc = await firestore.collection("users").doc(courierId).get();
  if (!doc.exists) return 0;
  return doc.data().wallet_balance || 0;
}

/**
 * Get the system wallet balance.
 */
export async function getSystemWalletBalance() {
  const doc = await firestore.collection("system_wallet").doc("wallet").get();
  if (!doc.exists) return 0;
  return doc.data().balance || 0;
}

/**
 * Deposit funds into a customer's wallet.
 */
export async function depositToCustomerWallet(customerId, depositAmount) {
  const customerRef = firestore.collection("users").doc(customerId);
  const doc = await customerRef.get();
  if (!doc.exists) throw new Error("Customer not found");
  const currentBalance = doc.data().wallet_balance || 0;
  const newBalance = currentBalance + depositAmount;
  await customerRef.update({ wallet_balance: newBalance });
  await firestore.collection("wallet_transactions").doc(customerId).update({
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "deposit",
      amount: depositAmount,
      timestamp: Date.now()
    })
  });
  return newBalance;
}

/**
 * Transfer fees (e.g., platform fees) to the system wallet.
 */
export async function transferFeesToSystemWallet(orderId, courierId, feeAmount) {
  const courierRef = firestore.collection("users").doc(courierId);
  const courierDoc = await courierRef.get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();
  const currentBalance = courierData.wallet_balance || 0;
  if (currentBalance < feeAmount) throw new Error("Insufficient wallet balance for fee transfer");

  await courierRef.update({ wallet_balance: currentBalance - feeAmount });
  
  const systemRef = firestore.collection("system_wallet").doc("wallet");
  const systemDoc = await systemRef.get();
  let systemBalance = systemDoc.exists ? systemDoc.data().balance : 0;
  await systemRef.set({ balance: systemBalance + feeAmount }, { merge: true });

  await firestore.collection("wallet_transactions").doc(courierId).update({
    transactions: firebase.firestore.FieldValue.arrayUnion({
      type: "platform_fee_transfer",
      amount: feeAmount,
      order_id: orderId,
      timestamp: Date.now()
    })
  });
}

/**
 * Finalize an order for a courier.
 * For wallet-paid orders, deduct from customer wallet and credit courier wallet.
 * The courier fee includes distance fee, waiting fees, and their share of upfront purchase cost.
 */
export async function finalizeOrder(orderId, courierId) {
  const orderRef = firestore.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();
  if (!orderDoc.exists) throw new Error("Order not found");
  const orderData = orderDoc.data();

  const courierRecord = orderData.couriers && orderData.couriers[courierId];
  if (!courierRecord) throw new Error("Courier record not found");
  
  const bidData = orderData.offers && orderData.offers[courierId];
  if (!bidData) throw new Error("Bid data not found for courier");

  // Calculate fees.
  const pickupDistance = bidData.pickup_estimation.distance || 0;
  const dropoffDistance = bidData.dropoff_estimation.distance || 0;
  const totalDistanceM = pickupDistance + dropoffDistance;
  const distanceInKm = totalDistanceM / 1000;
  
  // Retrieve courier's fee rate from user document.
  const courierDoc = await firestore.collection("users").doc(courierId).get();
  if (!courierDoc.exists) throw new Error("Courier not found");
  const courierData = courierDoc.data();
  
  const distanceFee = distanceInKm * (courierData.fee_per_km || 0);
  const upfrontPurchaseCost = bidData.upfront_purchase_cost || 0;
  const courierFee = distanceFee + courierRecord.waiting_fee_pickup + courierRecord.waiting_fee_dropoff + Number(upfrontPurchaseCost);
  const platformFee = courierFee * 0.10; // SYSTEM_COMMISSION_RATE = 10%
  const totalCustomerCharge = courierFee + platformFee;
  
  if (orderData.payment_mode.toLowerCase() === "wallet") {
    const customerRef = firestore.collection("users").doc(orderData.customer_id);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists) throw new Error("Customer not found");
    const customerBalance = customerDoc.data().wallet_balance || 0;
    if (customerBalance < totalCustomerCharge) throw new Error("Insufficient funds in customer wallet");
    await customerRef.update({ wallet_balance: customerBalance - totalCustomerCharge });
    
    await firestore.collection("wallet_transactions").doc(orderData.customer_id).update({
      transactions: firebase.firestore.FieldValue.arrayUnion({
        type: "order_payment",
        amount: totalCustomerCharge,
        order_id: orderId,
        timestamp: Date.now()
      })
    });
    
    const currentCourierBalance = courierData.wallet_balance || 0;
    await firestore.collection("users").doc(courierId).update({ wallet_balance: currentCourierBalance + courierFee });
    await firestore.collection("wallet_transactions").doc(courierId).update({
      transactions: firebase.firestore.FieldValue.arrayUnion({
        type: "order_credit",
        amount: courierFee,
        order_id: orderId,
        timestamp: Date.now()
      })
    });
    
    await transferFeesToSystemWallet(orderId, courierId, platformFee);
  } else {
    // For cash-paid orders, fees handling might differ (involving primary courier cash collection, etc.)
    await transferFeesToSystemWallet(orderId, courierId, platformFee);
  }
  
  // Update the courier's receipt inside the order document.
  await orderRef.update({
    [`couriers.${courierId}.finalized`]: true,
    [`couriers.${courierId}.receipt`]: {
      distance_fee: distanceFee,
      waiting_fee_pickup: courierRecord.waiting_fee_pickup,
      waiting_fee_dropoff: courierRecord.waiting_fee_dropoff,
      upfront_purchase_cost: Number(upfrontPurchaseCost),
      courier_fee: courierFee,
      platform_fee: platformFee,
      total_customer_charge: totalCustomerCharge,
      finalized_at: Date.now()
    }
  });
}
