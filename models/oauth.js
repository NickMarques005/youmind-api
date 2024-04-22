const mongoose = require('mongoose');

const oauthDataSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    refreshToken: { 
        type: String,
        default: "", 
    }
});

const OAuthData = mongoose.model('oauth', oauthDataSchema, 'oauth_data');

module.exports = OAuthData;