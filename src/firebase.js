
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';


// Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaBi8F2F5rTRLNP3J9sDQfWXE8sU3hh7o",
  authDomain: "oascanner-eac5e.firebaseapp.com",
  databaseURL: "https://oascanner-eac5e-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "oascanner-eac5e",
  storageBucket: "oascanner-eac5e.appspot.com",
  messagingSenderId: "822288648466",
  appId: "1:822288648466:web:f238ac518ce991bf0a0bcb",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth();

// Function to create a new user
const createUser = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Function to sign in a user
const signInUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Function to sign out a user
const signOutUser = () => {
  return signOut(auth);
};



// Get a reference to the database
const database = getDatabase(app);

export { database, ref, get, auth, createUser, signInUser, signOutUser };
