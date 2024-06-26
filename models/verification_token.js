
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const verificationTokenSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now
    },
    lastRenewedAt: {
        type: Date,
        default: Date.now
    },
    renewalCount: {
        type: Number,
        default: 0  
    }
});

verificationTokenSchema.pre('save', async function (next) {
    if (this.isModified('token')) {
        const salt = await bcrypt.genSalt(10);
        const hashedToken = await bcrypt.hash(this.token, salt);

        this.token = hashedToken;
    }

    next();
});

verificationTokenSchema.methods.compareToken = async function (token) {
    const result = await bcrypt.compareSync(token, this.token);
    return result;
};

const VerificationToken = mongoose.model("verification_token", verificationTokenSchema, 'verification_tokens');

module.exports = VerificationToken;
