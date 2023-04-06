import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA5bw4MYwLjeMjX5vp6Hyi-45QKZnB71jk",
    authDomain: "isaienko-test.firebaseapp.com",
    projectId: "isaienko-test",
    storageBucket: "isaienko-test.appspot.com",
    messagingSenderId: "990170133056",
    appId: "1:990170133056:web:6f48992d804c05bddf65a5",
    measurementId: "G-J81NMWKV2M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);