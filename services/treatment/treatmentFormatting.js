const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { PatientUser, DoctorUser } = require('../../models/users');
const { getInitialChatData } = require('../chat/chatServices');
const { calculateTreatmentOverallPerformance } = require('./performance/performanceServices');

const formatTreatment = async (treatment, userType) => {
    try {
        const oppositeUserId = userType === 'patient' ? treatment.doctorId : treatment.patientId;
        const oppositeUser = await (userType === 'patient' ? DoctorUser.findOne({ uid: oppositeUserId }) : PatientUser.findOne({ uid: oppositeUserId }));

        if (userType !== 'patient' && !oppositeUser) {
            console.error(`O paciente do ${userType} não foi encontrado`);
            return undefined;
        }

        /*
        ### Busca dados inicias de chat
        */
        const chatData = await getInitialChatData(treatment._id, oppositeUserId);

        /*
        ### Buscar históricos de medicações e questionários para o tratamento
        */
        const patientMedications = await PatientMedicationHistory.find({ patientId: treatment.patientId });
        const patientQuestionnaires = await PatientQuestionnaireHistory.find({ patientId: treatment.patientId });

        /*
        ### Filtragem dos medicamentos tomados e questionários respondidos
        */
        const takenMedications = patientMedications.filter(history => history.medication.taken === true).length;
        const answeredQuestionnaires = patientQuestionnaires.filter(history => history.questionnaire.answered === true).length;

        /*
        ### Buscar o tempo de uso do T-Watch 
        */

        /*
        ### Cálculo do desempenho atual
        */
        const overallPerformance = await calculateTreatmentOverallPerformance(treatment.patientId);

        const statusTreatment = {
            medications: takenMedications,
            questionnaires: answeredQuestionnaires,
            currentPerformance: overallPerformance
        };

        /*
        ### Busca dos avatares dos doutoras nas sessões do tratamento
        */
        const sessionsWithAvatars = await Promise.all(treatment.sessions.map(async (session) => {
            const engagedDoctor = await DoctorUser.findOne({ uid: session.engagedDoctor.uid });
            let engagedDoctorAvatar;
            if (engagedDoctor && engagedDoctor.avatar) {
                engagedDoctorAvatar = engagedDoctor.avatar;
            }
            return {
                engagedDoctor: {
                    uid: session.engagedDoctor.uid,
                    name: session.engagedDoctor.name,
                    gender: session.engagedDoctor.gender,
                    avatar: engagedDoctorAvatar
                },
                finalPerformance: session.finalPerformance,
                period: {
                    start: session.period.start,
                    end: session.period.end
                }
            };
        }));

        /*
        ### Retorno do tratamento formatado
        */
        return {
            _id: treatment._id,
            name: oppositeUser.name,
            email: oppositeUser.email,
            avatar: oppositeUser.avatar,
            phone: oppositeUser.phone,
            birth: oppositeUser.birth,
            gender: oppositeUser.gender,
            uid: oppositeUser.uid,
            online: oppositeUser.online,
            chat: chatData || undefined,
            startedAt: treatment.startedAt,
            status: statusTreatment,
            sessions: sessionsWithAvatars || [],
            treatmentStatus: treatment.status
        };
    }
    catch (err) {
        console.error("Houve um erro ao formatar tratamento: ", err);
    }
};

module.exports = { formatTreatment };