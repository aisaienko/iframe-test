const functions = require('firebase-functions');
const express = require('express');

const app = express();

const cors = require('cors');
app.use(cors({origin: true}));

const admin = require('firebase-admin');

const serviceAccount = require('./keys/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Routes
app.get('/hello-world', (req, res) => {
    return res.status(200).send('Hello World!');
});

// Create
app.post('/api/create', (req, res) => {
    (async () => {
        try {
            const id = req.body.id;
            await db.collection('users').doc('/' + id + '/')
                .create({
                    email: req.body.email,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    points: 0,
                });
            return res.status(200).send();
        } catch (error) {
            console.log(error);
            return res.status(500).send(error);
        }
    })();
});

// Read

// Update

// Delete

exports.app = functions.https.onRequest(app);
