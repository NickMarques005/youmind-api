//---config.js---//
const dotenv = require('dotenv').config();

const jwt_key = process.env.JWT_MAIN_KEY;
const refresh_key = process.env.JWT_REFRESH_KEY;

console.log("---KEYS:--- \nMAIN:", jwt_key, '\nREFRESH: ', refresh_key);

module.exports = {
    jwt_key,
    refresh_key
};