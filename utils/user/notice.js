const MessageTypes = require("../response/typeResponse");

const createNotice = ({ message, type, icon = MessageTypes.INFO, dontshow = undefined, acceptText = "OK", declineText = "Cancelar" } = {}) => {
    if (!message || !type) {
        return undefined;
    }
    
    return {
        message,
        type,
        icon,
        dontshow,
        acceptText,
        declineText
    };
};

module.exports = { createNotice };