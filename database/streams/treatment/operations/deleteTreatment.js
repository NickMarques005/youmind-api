
const handleDeleteTreatment = async (change, io) => {
    const treatmentId = change.documentKey._id.toString()
    console.log("TRATAMENTO DELETADO!");
    console.log(treatmentId);

};

module.exports = handleDeleteTreatment;