// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

//TODO: create production/staging/testing configs (add two more config constants and select based on conf file )

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
