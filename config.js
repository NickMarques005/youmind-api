//---config.js---//
const dotenv = require('dotenv').config();

const main_key = process.env.JWT_MAIN_KEY;

console.log("MAIN KEY: ", main_key);

module.exports = {
    jwt_key: main_key
};