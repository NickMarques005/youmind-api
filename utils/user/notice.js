const MessageTypes = require("../response/typeResponse");

const createNotice = (message, type = 'welcome', icon = MessageTypes.INFO) => {
    return {
        message,
        type,
        icon
    };
};

module.exports = { createNotice };