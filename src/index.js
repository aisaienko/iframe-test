import './sass/style.scss';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
// import { initMemoryGame } from './games/memorymatch'
import pym from 'pym.js';
import Memory from './games/memorymatch';
import {openModal} from './toolbox/modal';
import { on, off } from './toolbox/event';
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
const db = getFirestore(app);
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const customerId = urlParams.get('cid');

document.addEventListener("DOMContentLoaded", ready);
function ready() {
    window.pymChild = pym.Child({
        id: 'example',
        polling: 500,
    });
    if (customerId) {
        getDoc(doc(db, 'users', customerId)).then((customerStapshot) => {
            if (customerStapshot.exists()) {
                const customer = customerStapshot.data();
                document.getElementById('welcome-message').innerHTML = `Welcome ${customer.firstName} ${customer.lastName}`;
                const memoryGame = new Memory(document.querySelector('.game'));
                memoryGame.setup();
                pymChild.sendMessage('iframe:loaded');
            } else {
                document.getElementById('welcome-message').innerHTML = 'No data Found for current user';
            }
        });
    } else {
        const redirectUrl = btoa('Page-Show,cid,engagementhub');
        var modalHtml = `
        <div class="login-form-wrapper" data-js-login-form>
            <form id="login_form" name="login_form" autocomplete="">
                <fieldset name="user_info">
                    <div class="base-input field">
                        <label for="email">Email Address</label>
                        <input id="email" name="email" type="email" placeholder="Email Address" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$">
                    </div>
                    <div class="base-checkbox field">
                        <input id="rules" type="checkbox" name="rules" required>
                        <label for="rules">I acceept the <a href="https://dev42-lora-loreal.demandware.net/s/Kiehls/privacy-policy.html" target="_blank">Privacy Policy</a>.</label>
                    </div>
                </fieldset>
                <button type="submit" class="btn btn_login">Continue</button>
            </form>
            <p class="join-rewards-url"><strong> First time visiting? <a href="https://dev42-lora-loreal.demandware.net/s/Kiehls/login?r=${redirectUrl}&loyalty=true" target="_top">Join Kiehl's Family Rewards</a></strong></p>
        </div>
        <div data-js-registration class="h-hidden">
            <p class="join-rewards-url"><strong> <a href="https://dev42-lora-loreal.demandware.net/s/Kiehls/login?r=${redirectUrl}&loyalty=true" target="_top">Join Kiehl's Family Rewards</a></strong></p>
            <p>Already joined Kiehl's Family Rewards?  <a href="#" class="btn-switch-login">Login</a></p>
        </div>
        `;
        var modal = openModal('Sign In To Play!', modalHtml, true);
        on('submit', document, onLogin.bind(this, modal));
        on('click', document, switchLogin);
    }

    if (document.querySelector('[data-add-points]')) {
        on('click', document.querySelector('[data-add-points]'), (e) => {
            e.preventDefault();
            if (window.currentCustomer && window.currentCustomerId) {
                const washingtonRef = doc(db, "users", window.currentCustomerId);
                updateDoc(washingtonRef, {
                    points: window.currentCustomer.points + 10,
                }).then(()  => {
                    getDoc(doc(db, 'users', window.currentCustomerId)).then((doc) => {
                        var customer = doc.data();
                        window.currentCustomerId = doc.id;
                        window.currentDoc = doc;
                        window.currentCustomer = customer;
                        document.getElementById('welcome-message').innerHTML = `Welcome ${window.currentCustomer.firstName} ${window.currentCustomer.lastName}. You have ${window.currentCustomer.points} points`;
                    });
                });
            }
        });
    }
}

function switchLogin(e) {
    var button;
    if (e.target.classList.contains("btn-switch-login")) {
        button = e.target;
    }
    if (!button) {
        button = e.target.closest('.btn-switch-login');
    }
    if (!button) {
        return;
    }
    e.preventDefault();
    var registrationConteiner = document.querySelector('[data-js-registration]');
    var loginConteiner = document.querySelector('[data-js-login-form]');
    registrationConteiner.classList.add('h-hidden');
    loginConteiner.classList.remove('h-hidden');
}

function onLogin(modal, e) {
    const form = e.target;
    if (form.name !== 'login_form') {
        return;
    }
    const formData = serializeForm(form);
    const email = formData.email;
    const isRuleAccepted = formData.rules;
    if ( !email || !isRuleAccepted ) {
        return true;
    } else {
        e.preventDefault();
    }
    const users = collection(db, "users");

    // Create a query against the collection.
    const q = query(users, where("email", "==", email));
    getDocs(q).then((querySnapshot) => {
        var customer;
        querySnapshot.forEach((doc) => {
            customer = doc.data();
            window.currentCustomerId = doc.id;
            window.currentDoc = doc;
            window.currentCustomer = customer;
        });
        if (!customer) {
            var registrationConteiner = document.querySelector('[data-js-registration]');
            var loginConteiner = document.querySelector('[data-js-login-form]');
            registrationConteiner.classList.remove('h-hidden');
            loginConteiner.classList.add('h-hidden');
            return;
        }
        modal.destroyModal();
        document.getElementById('welcome-message').innerHTML = `Welcome ${customer.firstName} ${customer.lastName}. You have ${customer.points} points`;
        var pointsButton = document.querySelector('[data-add-points]');
        pointsButton.classList.remove('h-hidden');
    });
}

function serializeForm(form) {
	var obj = {};
	var formData = new FormData(form);
	for (var key of formData.keys()) {
		obj[key] = formData.get(key);
	}
	return obj;
};

