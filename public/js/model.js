// model.js

// Firebase Configuration
const firebaseConfig = {  
    apiKey: "AIzaSyBXyTzYT_kjwcibZo3zXQrhOdPyUksodig",  
    authDomain: "wassally25.firebaseapp.com",  
    databaseURL: "https://wassally25-default-rtdb.firebaseio.com",  
    projectId: "wassally25",  
    storageBucket: "wassally25.firebasestorage.app",  
    messagingSenderId: "673929758317",  
    appId: "1:673929758317:web:de4fe369507fb58d492164",  
    measurementId: "G-W5Z57HVDCK"  
  };  
  // Initialize Firebase (Avoid duplicate initialization)
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // Firebase services
  const auth = firebase.auth();
  const db = firebase.database();
  
  // Helper functions
  function getUserFromLocalStorage() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  
  async function signupUser(username, email, password, role) {
    await auth.createUserWithEmailAndPassword(email, password);
    const currentUser = auth.currentUser;
    await db.ref('users/' + currentUser.uid).set({
      username,
      email,
      role
    });
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify({
      id: currentUser.uid,
      name: username,
      email,
      role
    }));
  }
  
  async function signinUser(email, password) {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    const snapshot = await db.ref('users/' + uid).once('value');
    const userData = snapshot.val();
    localStorage.setItem('user', JSON.stringify({
      id: uid,
      name: userData.username,
      email: userData.email,
      role: userData.role
    }));
  }
  
  async function postJob(title, description, budget) {
    const user = getUserFromLocalStorage();
    const newJobRef = db.ref('jobs').push();
    await newJobRef.set({
      title,
      description,
      budget,
      clientId: user.id,
      clientName: user.name,
      status: 'open',
      createdAt: new Date().toISOString()
    });
  }
  
  async function fetchJobs() {
    const snapshot = await db.ref('jobs').orderByChild('status').equalTo('open').once('value');
    const jobs = [];
    snapshot.forEach((child) => {
      jobs.push({ id: child.key, ...child.val() });
    });
    return jobs;
  }
  
  async function applyForJob(jobId) {
    const user = getUserFromLocalStorage();
    const jobRef = db.ref('jobs/' + jobId);
    const snapshot = await jobRef.once('value');
    const job = snapshot.val();
    if (job.status !== 'open') throw new Error('Job not available');
    await jobRef.update({
      status: 'assigned',
      courierId: user.id,
      courierName: user.name
    });
  }
  
  export {
    signupUser,
    signinUser,
    postJob,
    fetchJobs,
    applyForJob,
    getUserFromLocalStorage
  };