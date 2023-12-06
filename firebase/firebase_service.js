//firebase-service.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, child } = require('firebase/database');

const firebaseConfig = {
    apiKey: "AIzaSyASv_p_C34PMmax4cWyPcHkwmKNpDDhlWI",
    authDomain: "oficialyoumindnotify-278bf.firebaseapp.com",
    databaseURL: "https://oficialyoumindnotify-278bf-default-rtdb.firebaseio.com",
    projectId: "oficialyoumindnotify-278bf",
    storageBucket: "oficialyoumindnotify-278bf.appspot.com",
    messagingSenderId: "84548222482",
    appId: "1:84548222482:web:5f781d57668393fff362cb",
    measurementId: "G-1MQHCCCW1M"
};


const fireserver = initializeApp(firebaseConfig);
const db = getDatabase();
const dbRef = ref(db);

const saveToken = async (userId, token) => {
    console.log(userId);
    const values = (await get(child(dbRef, `userTokens/${userId}`))).val() ?? {};
    const payload = { ...values, token };
    set(ref(db, `/userTokens/${userId}`), payload)
}

const getToken = async (userId) => {
    console.log("GET TOKEN!! -> ", userId );
    const values = (await get(child(dbRef, `userTokens/${userId}`))).val();

    console.log("VALUES: ", values);
    return values ?? {};
}


module.exports = {
    fireserver,
    saveToken,
    getToken
}