// model.js

import { add_log, get_logs, clear_logs } from "./indexeddb_logs.js";

// Firebase Configuration
const firebase_config = {
  apiKey: "AIzaSyBXyTzYT_kjwcibZo3zXQrhOdPyUksodig",
  authDomain: "wassally25.firebaseapp.com",
  databaseURL: "https://wassally25-default-rtdb.firebaseio.com",
  projectId: "wassally25",
  storageBucket: "wassally25.appspot.com",
  messagingSenderId: "673929758317",
  appId: "1:673929758317:web:de4fe369507fb58d492164",
  measurementId: "G-W5Z57HVDCK"
};

// Initialize Firebase (avoid duplicate initialization)
if (!firebase.apps.length) {
  firebase.initializeApp(firebase_config);
}

// Firebase services
const auth = firebase.auth();
const db = firebase.database();


function initialize_firebase_app() {
  if (!firebase.apps.length) {
    return firebase.initializeApp(firebase_config);
  } 

  return firebase.app();
}

async function get_database(){
  if (!db) {
    initialize_firebase_app();
    db = firebase.database();
  }

  return db;
}

// Helper functions
function get_user_from_local_storage() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

async function signup_user(username, email, password, role) {
  const user_credential = await auth.createUserWithEmailAndPassword(email, password);
  const current_user = user_credential.user;

  if (!role) {
    alert("invalid role");
    throw new Error('User role is required.');
  }

  await db.ref('users/' + current_user.uid).set({
    username,
    email,
    role
  });

  // Save to localStorage
  let user_local_storage = JSON.stringify({
    id: current_user.uid,
    name: username,
    email,
    role
  });
  localStorage.setItem('user', user_local_storage);

  alert(user_local_storage);
}

async function signin_user(email, password) {
  const user_credential = await auth.signInWithEmailAndPassword(email, password);
  const uid = user_credential.user.uid;

  alert("UID: " + uid);

  const snapshot = await db.ref('users/' + uid).once('value');
  const user_data = snapshot.val();

  if (!user_data || !user_data.role) {
    alert("user error:" + user_data);
    throw new Error('User role not found. Ensure user has a role assigned in the database.');
  }

  // Save user details to localStorage
  localStorage.setItem('user', JSON.stringify({
    id: uid,
    name: user_data.username,
    email: user_data.email,
    role: user_data.role
  }));

  return user_data;
}

async function post_job(title, description, budget) {
  const user = get_user_from_local_storage();
  const new_job_ref = db.ref('jobs').push();

  await new_job_ref.set({
    title,
    description,
    budget,
    client_id: user.id,
    client_name: user.name,
    status: 'open',
    created_at: firebase.database.ServerValue.TIMESTAMP
  });
}

async function fetch_jobs() {
  const snapshot = await db.ref('jobs').orderByChild('status').equalTo('open').once('value');
  const jobs = [];

  snapshot.forEach((child) => {
    jobs.push({ id: child.key, ...child.val() });
  });

  return jobs;
}

//TODO open a modal window to get offer details
//TODO do not assign offer here, when customer accepts an offer assign it.
async function apply_for_job(job_id) {
  const user = get_user_from_local_storage();
  const job_ref = db.ref('jobs/' + job_id);
  const snapshot = await job_ref.once('value');
  const job = snapshot.val();

  if (job.status !== 'open') {
    throw new Error('Job not available.');
  }

  await job_ref.update({
    status: 'assigned',
    courier_id: user.id,
    courier_name: user.name
  });
}

export {
  signup_user,
  signin_user,
  post_job,
  fetch_jobs,
  get_user_from_local_storage,
  get_database,
  initialize_firebase_app
};