
const handleUpdateMessage = async (change) => {
    const updatedMessage = change.fullDocument;
    console.log("Mensagem atualizada: ", updatedMessage);
    return;
}

module.exports = handleUpdateMessage;