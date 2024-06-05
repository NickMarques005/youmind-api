const { PatientUser } = require('../../models/users');
const Treatment = require('../../models/treatment');
const { PatientQuestionnaireHistory } = require('../../models/patient_history');
const { getPatientHistoryById } = require('../../services/historyService');

const emitUpdateHistory = async (io, doctorId, patientId) => {
    try {
        const updateHistory = await getPatientHistoryById(patientId);
        if (updateHistory) {
            io.to(doctorId).emit('updateHistory', updateHistory);
            console.log(`Histórico emitido para a sala ${doctorId}`);
        }
    } catch (error) {
        console.error('Erro ao emitir histórico:', error);
    }
};


const handleQuestionnaireHistoryChange = async (io, change) => {
    console.log("QuestionnaireHistory Change Stream Event");

    try {
        if (change.operationType === 'insert') {
            
            console.log('Novo questionário inserido: ', change.fullDocument);
        } else if (change.operationType === 'update') {

            console.log('Questionário atualizado: ', change.fullDocument);
            const updatedFields = change.updateDescription.updatedFields;
            if (updatedFields && (updatedFields['questionnaire.answered'] === false || updatedFields['questionnaire.answered'] === true)) {
                const questionnaireId = change.documentKey._id;
                const questionnaireHistory = await PatientQuestionnaireHistory.findById(questionnaireId);
                if (!questionnaireHistory) {
                    console.error(`Questionário não foi encontrado no histórico: ${questionnaireId}`);
                    return;
                }
        
                const patientId = questionnaireHistory.patientId;
                const patient = await PatientUser.findOne({ uid: patientId });
                if (!patient) {
                    console.error(`Paciente não encontrado: ${patientId}`);
                    return;
                }
        
                const treatment = await Treatment.findOne({ patientId: patientId });
                if (!treatment) {
                    console.log("Tratamento não encontrado");
                    return;
                }
        
                const doctorId = treatment.doctorId;

                await emitUpdateHistory(io, doctorId, patientId);
            }
        }
    } catch (error) {
        console.error('Erro ao lidar com a alteração do histórico do questionário:', error);
    }
};

const questionnaireHistoryStream = (io) => {
    const changeStream = PatientQuestionnaireHistory.watch();
    changeStream.on('change', change => handleQuestionnaireHistoryChange(io, change));
};

module.exports = questionnaireHistoryStream;