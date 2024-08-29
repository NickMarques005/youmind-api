const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { PatientUser, DoctorUser } = require('../../models/users');
const { getInitialChatData } = require('../chat/chatServices');
const { calculateTreatmentOverallPerformance } = require('./performance/performanceServices');

const formatTreatment = async (treatment, userType) => {
    try {
        const userId = userType === 'patient' ? treatment.patientId : treatment.doctorId;
        const user = await (userType === 'patient' ? PatientUser.findOne({ uid: userId }) : DoctorUser.findOne({ uid: userId }));

        if (!user) throw new Error(`Usuário ${userType} não encontrado`);

        /*
        ### Busca dados inicias de chat
        */
        const chatData = await getInitialChatData(treatment._id, userId);

        /*
        ### Buscar históricos de medicações e questionários para o tratamento
        */
        const patientMedications = await PatientMedicationHistory.find({ patientId: userId });
        const patientQuestionnaires = await PatientQuestionnaireHistory.find({ patientId: userId });

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
        const overallPerformance = await calculateTreatmentOverallPerformance(userId);

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
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            phone: user.phone,
            birth: user.birth,
            gender: user.gender,
            uid: user.uid,
            online: user.online,
            _id: treatment._id,
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