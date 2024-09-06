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
        isMarked: {
            type: Boolean,
            required: false
        },
        readBy: [{
            type: String
        }]
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema, 'message_data');

module.exports = Message;