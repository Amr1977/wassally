// model.js
import { getDatabase, ref, set, push, get, update, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Firebase initialization
const firebase_config = {
    apiKey: "AIzaSyBXyTzYT_kjwcibZo3zXQrhOdPyUksodig",
    authDomain: "wassally25.firebaseapp.com",
    databaseURL: "https://wassally25-default-rtdb.firebaseio.com",
    projectId: "wassally25",
    storageBucket: "wassally25.firebasestorage.app",
    messagingSenderId: "673929758317",
    appId: "1:673929758317:web:de4fe369507fb58d492164",
    measurementId: "G-W5Z57HVDCK"
};

const app = initializeApp(firebase_config);
const db = getDatabase(app);
const auth = getAuth(app);

// Create user using Firebase Authentication and save to Database
function createAccount(email, password, userData) {
    return createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            const user = userCredential.user;
            const fullUserData = { uid: user.uid, email: user.email, ...userData };
            const usersRef = ref(db, "users");
            const newUserRef = push(usersRef);
            return set(newUserRef, fullUserData);
        });
}

// Save user data to Local Storage
function saveUserToLocalStorage(user) {
    localStorage.setItem("user", JSON.stringify(user));
}

// Get user data from Local Storage
function getUserFromLocalStorage() {
    return JSON.parse(localStorage.getItem("user"));
}

// Signin user using Firebase Authentication
function signinUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export { db, createAccount, signinUser, saveUserToLocalStorage, getUserFromLocalStorage };