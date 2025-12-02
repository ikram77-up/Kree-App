// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA1oLRgNf1AgM__0w8ryBDcsphWNJE9lms",
    authDomain: "projet-kree-f983c.firebaseapp.com",
    projectId: "projet-kree-f983c",
    storageBucket: "projet-kree-f983c.firebasestorage.app",
    messagingSenderId: "847757431275",
    appId: "1:847757431275:web:5c47d8f5f9d8d3109ac9ae",
    measurementId: "G-43X34R8T9M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

export default app;

