const createNotice = ({ message, type, icon, dontshow = undefined, acceptText = "OK", declineText } = {}) => {
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