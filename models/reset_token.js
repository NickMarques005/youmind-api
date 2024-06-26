//---reset_token.js---//

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const resetTokenSchema = new mongoose.Schema({
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
    }
});

resetTokenSchema.pre('save', async function(next) {
    if (this.isModified('token')) {
        const salt = await bcrypt.genSalt(10);
        const hashedToken = await bcrypt.hash(this.token, salt);

        this.token = hashedToken;
    }

    next();
});

resetTokenSchema.methods.compareToken = async function(token) {
    const result = await bcrypt.compareSync(token, this.token);
    return result;
};

const ResetToken = mongoose.model("reset_token", resetTokenSchema, 'reset_tokens');

module.exports = ResetToken;
