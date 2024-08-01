
const handleUpdateMessage = async (change, io) => {
    const updatedMessage = change.fullDocument;
    console.log("Mensagem atualizada: ", updatedMessage);
    return;
}

module.exports = handleUpdateMessage;