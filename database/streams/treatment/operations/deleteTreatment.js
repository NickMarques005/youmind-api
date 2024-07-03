
const handleDeleteTreatment = async (change, io) => {
    const treatmentId = change.documentKey._id.toString()
    console.log("TRATAMENTO DELETADO!");
    console.log(treatmentId);

    // io.to(treatmentId).emit('treatmentDelete', { data: treatmentId });
};

module.exports = handleDeleteTreatment;