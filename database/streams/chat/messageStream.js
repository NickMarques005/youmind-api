const Message = require('../../../models/message');
const handleInsertMessage = require('./operations/insertMessage');
const handleUpdateMessage = require('./operations/updateMessage');

const handleMessageChange = async (io, change) => {
    console.log("Message Change Stream Event: ", change);

    switch (change.operationType) {
        case 'insert':
            await handleInsertMessage(change);
            break;
        case 'update':
            await handleUpdateMessage(change);
            break;
        default:
            console.error('Tipo de operação não configurado: ', change.operationType);
    }
}

const messageStream = (io) => {
    const messageChangeStream = Message.watch();
    messageChangeStream.on('change', change => handleMessageChange(io, change));
}

module.exports = messageStream;