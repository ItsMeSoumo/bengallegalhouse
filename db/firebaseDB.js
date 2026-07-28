// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyClU8weFBHDDRBvE8OU7kUZw5oXFK5v6sI",
    authDomain: "soham-cbt.firebaseapp.com",
    projectId: "soham-cbt",
    storageBucket: "soham-cbt.firebasestorage.app",
    messagingSenderId: "441456854735",
    appId: "1:441456854735:web:afbac472c1b1aac7b419ba",
    measurementId: "G-QS4TC61FVF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);