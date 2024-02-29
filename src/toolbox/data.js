import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

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

export default async function getCustomer() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('cid');
    var customerStapshot = await getDoc(doc(db, 'users', customerId));
    if (customerStapshot.exists()) {
        return customerStapshot.data();
    }
    return null;
};