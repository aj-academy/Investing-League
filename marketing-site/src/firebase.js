// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAb9jVLs6ObQS8YVawl3_Vk3GVIUYv3SCQ",
  authDomain: "theinvestingleague-12.firebaseapp.com",
  projectId: "theinvestingleague-12",
  storageBucket: "theinvestingleague-12.firebasestorage.app",
  messagingSenderId: "684777710227",
  appId: "1:684777710227:web:5e3d85de6bb2714d306366",
  measurementId: "G-0PHY0QF2NV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);