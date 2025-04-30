// indexeddb_logs.js

// Open or create the IndexedDB database
const request = indexedDB.open("logs_database", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("logs_store", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (event) => {
  console.log("database_opened_successfully");
};

// Function to add a log entry
function add_log(message) {
  const db = request.result;
  const transaction = db.transaction("logs_store", "readwrite");
  const store = transaction.objectStore("logs_store");

  const log_entry = {
    timestamp: new Date().toISOString(),
    message: message,
  };

  store.add(log_entry);

  transaction.oncomplete = () => {
    console.log("log_added_successfully");
  };

  transaction.onerror = () => {
    console.error("error_adding_log");
  };
}

// Function to retrieve all log entries
function get_logs() {
  const db = request.result;
  const transaction = db.transaction("logs_store", "readonly");
  const store = transaction.objectStore("logs_store");

  const request_logs = store.getAll();

  request_logs.onsuccess = () => {
    console.log("logs_retrieved:", request_logs.result);
  };

  request_logs.onerror = () => {
    console.error("error_retrieving_logs");
  };
}

// Function to clear all log entries
function clear_logs() {
  const db = request.result;
  const transaction = db.transaction("logs_store", "readwrite");
  const store = transaction.objectStore("logs_store");

  const clear_request = store.clear();

  clear_request.onsuccess = () => {
    console.log("all_logs_cleared");
  };

  clear_request.onerror = () => {
    console.error("error_clearing_logs");
  };
}