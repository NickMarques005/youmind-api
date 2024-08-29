
const handleDeleteHistoryMedication = async (change, io) => {
    const medicationHistoryId = change.documentKey._id;

    console.log("Histórico de medicamento excluído: ", medicationHistoryId);
}

module.exports = handleDeleteHistoryMedication;