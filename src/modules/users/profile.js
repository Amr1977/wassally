/**
 * @file profile.js
 * @description Manages user profiles for couriers and customers.
 */
const users = [];

/**
 * Creates a new user profile.
 * @param {Object} user_data
 * @returns {Promise<Object>} The created user.
 */
export async function create_user(user_data) {
  const new_user = { id: users.length + 1, ...user_data };
  users.push(new_user);
  console.log("User created:", new_user);
  return new_user;
}

/**
 * Retrieves a user by email.
 * @param {string} email
 * @returns {Promise<Object|null>} The user or null if not found.
 */
export async function get_user_by_email(email) {
  return users.find(user => user.email === email) || null;
}

/**
 * Updates an existing user profile.
 * @param {number} user_id
 * @param {Object} updates
 * @returns {Promise<Object>} The updated user.
 */
export async function update_user(user_id, updates) {
  const user = users.find(u => u.id === user_id);
  if (!user) throw new Error('User not found');
  Object.assign(user, updates);
  console.log("User updated:", user);
  return user;
}

/**
 * Deletes a user profile.
 * @param {number} user_id
 * @returns {Promise<boolean>} Success status.
 */
export async function delete_user(user_id) {
  const index = users.findIndex(u => u.id === user_id);
  if (index === -1) throw new Error('User not found');
  users.splice(index, 1);
  console.log("User deleted:", user_id);
  return true;
}