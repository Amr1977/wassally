/**
 * @fileOverview Provides functions for managing customer profiles and their orders.
 */

import { firestore } from "../../firebase.js";

/**
 * Retrieves the profile for a given customer.
 *
 * @param {string} customer_id - The Firestore document ID of the customer.
 * @returns {Promise<Object>} Resolves with the customer's profile data.
 * @throws Will throw an error if the customer is not found.
 */
export async function getCustomerProfile(customer_id) {
  const customerRef = firestore.collection("users").doc(customer_id);
  const doc = await customerRef.get();
  if (!doc.exists) {
    throw new Error("Customer not found");
  }
  return doc.data();
}

/**
 * Updates the profile data for a given customer.
 *
 * @param {string} customer_id - The Firestore document ID of the customer.
 * @param {Object} updateData - An object representing the fields to update.
 * @returns {Promise<void>} Resolves when the update is successful.
 */
export async function updateCustomerProfile(customer_id, updateData) {
  const customerRef = firestore.collection("users").doc(customer_id);
  await customerRef.update(updateData);
}

/**
 * Deletes a customer's profile from the database.
 *
 * @param {string} customer_id - The Firestore document ID of the customer.
 * @returns {Promise<void>} Resolves when deletion is complete.
 */
export async function deleteCustomerProfile(customer_id) {
  const customerRef = firestore.collection("users").doc(customer_id);
  await customerRef.delete();
}

/**
 * Lists all orders made by the given customer.
 *
 * @param {string} customer_id - The Firestore document ID of the customer.
 * @returns {Promise<Array<Object>>} Resolves with an array of order objects.
 */
export async function listCustomerOrders(customer_id) {
  const ordersSnapshot = await firestore.collection("orders")
    .where("customer_id", "==", customer_id)
    .get();
  return ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}