// Require Items
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
var serviceAccount = require("./configs/burj-al-arab-pro-firebase-adminsdk-zw2gy-654cf981f4.json");

// Using Items
const app = express();
app.use(bodyParser.json());
app.use(cors());
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DB_DURL
});

// MongoDB
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vc8eu.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookingsCollection = client.db("burjAlArab").collection("bookings");
    // Data Insert
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookingsCollection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    });
    // Data Read
    app.get('/bookings', (req, res) => {
        // console.log(req.headers.authorization);
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // console.log({ idToken });
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(decodedToken => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail === queryEmail) {
                        bookingsCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    } else {
                        res.status(401).send('Unauthorized access');
                    }
                })
                .catch(error => {
                    res.status(401).send('Unauthorized access');
                });
        } else {
            res.status(401).send('Unauthorized access');
        }
    })
});

const port = 5000;
app.listen(port);