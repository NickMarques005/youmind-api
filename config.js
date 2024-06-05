const dotenv = require('dotenv').config();

const jwt_key = process.env.JWT_MAIN_KEY;
const youmind_email = process.env.GMAIL_ADDRESS;

console.log("---KEYS:--- \nMAIN:", jwt_key);

module.exports = {
    jwt_key,
    youmind_email
};