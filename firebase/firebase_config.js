const admin = require('firebase-admin');

const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://oficialyoumindnotify-278bf-default-rtdb.firebaseio.com"
});

console.log('Firebase Admin inicializado corretamente.');

const firebase_db = admin.database();
const firestore = admin.firestore();
const firebase_messaging = admin.messaging();
const firebase_auth = admin.auth();

module.exports = { firebase_db, firestore, firebase_messaging, firebase_auth };
