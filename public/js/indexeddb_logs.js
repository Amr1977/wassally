// indexeddb_logs.js

// Open or create IndexedDB
export const open_database = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("logs_database", 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore("logs_store", { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// Add a log
export async function add_log(message) {
  try {
    const db = await open_database();
    const transaction = db.transaction("logs_store", "readwrite");
    const store = transaction.objectStore("logs_store");

    const log_entry = {
      timestamp: new Date().toISOString(),
      message,
    };

    store.add(log_entry);

    transaction.oncomplete = () => console.log("log_added_successfully");
    transaction.onerror = () => console.error("error_adding_log");
  } catch (error) {
    console.error("error_opening_database:", error);
  }
}

// Retrieve all logs
export async function get_logs() {
  try {
    const db = await open_database();
    const transaction = db.transaction("logs_store", "readonly");
    const store = transaction.objectStore("logs_store");

    const request = store.getAll();

    request.onsuccess = () => console.log("logs_retrieved:", request.result);
    request.onerror = () => console.error("error_retrieving_logs");
  } catch (error) {
    console.error("error_opening_database:", error);
  }
}

// Clear all logs
export async function clear_logs() {
  try {
    const db = await open_database();
    const transaction = db.transaction("logs_store", "readwrite");
    const store = transaction.objectStore("logs_store");

    const request = store.clear();

    request.onsuccess = () => console.log("all_logs_cleared");
    request.onerror = () => console.error("error_clearing_logs");
  } catch (error) {
    console.error("error_opening_database:", error);
  }
}