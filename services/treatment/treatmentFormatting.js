const { PatientMedicationHistory, PatientQuestionnaireHistory } = require('../../models/patient_history');
const { PatientUser, DoctorUser } = require('../../models/users');
const { getInitialChatData } = require('../chat/chatServices');
const { calculateTreatmentOverallPerformance } = require('./performance/performanceServices');

const formatTreatment = async (treatment, userType) => {
    try {
        const treatmentId = treatment._id.toString();

        const userId = userType === 'patient' ? treatment.patientId : treatment.doctorId;
        const oppositeUserId = userType === 'patient' ? treatment.doctorId : treatment.patientId;
        let oppositeUser;

        if (!userId) {
            if (userType === 'patient') {
                console.log("Você não está nesse tratamento!");
                return undefined;
            }
        }

        if (oppositeUserId) {
            if (userType === 'patient') {
                oppositeUser = await DoctorUser.findOne({ uid: oppositeUserId });
            }
            else {
                oppositeUser = await PatientUser.findOne({ uid: oppositeUserId });
            }
        }

        console.log("Usuário oposto no tratamento: ", oppositeUser);

        if (userType === 'doctor' && !oppositeUser) {
            console.error(`O paciente do doutor não foi encontrado`);
            return undefined;
        }

        /*
        ### Busca dados iniciais de chat através do userId atual caso o tratamento esteja ativo
        */
        let chatData;

        if (treatment.treatmentStatus === 'active' && oppositeUser) {
            chatData = await getInitialChatData(treatment._id, userId);
        }

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

        const statusPerformance = {
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
                    name: session.engagedDoctor.name || engagedDoctor.name,
                    gender: session.engagedDoctor.gender || engagedDoctor.gender,
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
        const formattedTreatment = {
            _id: treatmentId,
            name: oppositeUser ? oppositeUser.name : undefined,
            email: oppositeUser ? oppositeUser.email : undefined,
            avatar: oppositeUser ? oppositeUser.avatar : undefined,
            phone: oppositeUser ? oppositeUser.phone : undefined,
            birth: oppositeUser ? oppositeUser.birth : undefined,
            gender: oppositeUser ? oppositeUser.gender : undefined,
            uid: oppositeUser ? oppositeUser.uid : undefined,
            online: oppositeUser ? oppositeUser.online : undefined,
            chat: chatData || undefined,
            startedAt: treatment.startedAt,
            status: statusPerformance,
            sessions: sessionsWithAvatars || [],
            treatmentStatus: treatment.status,
            private_treatment: oppositeUser ? oppositeUser.private_treatment : undefined
        };

        console.log("Tratamento a ser enviado: ", formattedTreatment);
        return formattedTreatment;
    }
    catch (err) {
        console.error("Houve um erro ao formatar tratamento: ", err);
    }
};

module.exports = { formatTreatment };