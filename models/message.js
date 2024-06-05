const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: String,
            required: true
        },
        sender: {
            type: String,
            required: true
        },
        audioUrl: {
            type: String
        },
        duration: {
            type: String
        },
        content: {
            type: String,
            required: true
        },
        readBy: [{
            type: String
        }]
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema, 'message_data');

module.exports = Message;