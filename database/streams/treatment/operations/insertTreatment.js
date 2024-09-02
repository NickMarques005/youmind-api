const { PatientUser, DoctorUser } = require("../../../../models/users");
const { formatTreatment } = require("../../../../services/treatment/treatmentFormatting");
const { handleStartPatientTreatmentServices } = require("../../../../services/treatment/treatmentServices");
const { emitTreatmentInitiate } = require("../../../../socket/events/treatmentEvents");
const { createNotice } = require("../../../../utils/user/notice");

const handleInsertTreatment = async (change, io) => {
    const newTreatment = change.fullDocument;

    const patientId = newTreatment.patientId;
    const doctorId = newTreatment.doctorId;

    const currentPatient = await PatientUser.findOne({ uid: patientId });
    if (!currentPatient) return console.error("Houve um erro: Usuário paciente não encontrado após a inserção do tratamento!");

    const currentDoctor = await DoctorUser.findOne({ uid: doctorId });
    if (!currentDoctor) return console.error("Houve um erro: Usuário médico não encontrado após a inserção do tratamento!");

    /*
    ### Atualizando o campo `welcomeTreatment` para ambos os usuários
    */
    if (currentPatient) {
        currentPatient.welcomeTreatment = true;
        await currentPatient.save();
    }
    if (currentDoctor) {
        currentDoctor.welcomeTreatment = true;
        await currentDoctor.save();
    }
    
    /*
    ### Formatação dos dados do tratamento para ambos os usuários
    */
    const treatmentPatientInfo = await formatTreatment(newTreatment, currentPatient.type);
    const treatmentDoctorInfo = await formatTreatment(newTreatment, currentDoctor.type);
    if (!treatmentPatientInfo || !treatmentDoctorInfo) return console.error('Erro ao formatar tratamento.');

    /*
    ### Iniciando os serviços de tratamento para o paciente
    */
    await handleStartPatientTreatmentServices(patientId);

    const messagePatient = `Parabéns por iniciar o tratamento com ${treatmentPatientInfo.name}! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;
    const messageDoctor = `Parabéns por iniciar o tratamento com ${treatmentDoctorInfo.name}! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;

    const noticePatient = createNotice({ message: messagePatient, type: "welcome", dontshow: true, acceptText: "Sim", declineText: "Não, Obrigado" });
    const noticeDoctor = createNotice({ message: messageDoctor, type: "welcome", dontshow: true, acceptText: "Sim", declineText: "Não, Obrigado" });

    const patientInfo = {
        patientId,
        treatment: treatmentPatientInfo,
        notice: noticePatient,
        is_treatment_running: true
    };

    const doctorInfo = {
        doctorId,
        treatment: treatmentDoctorInfo,
        notice: noticeDoctor
    };

    /*
    ### Emitindo o evento de início do tratamento via socket
    */
    await emitTreatmentInitiate({ io, patientInfo, doctorInfo });

    console.log("Tratamento e Notice enviados...");
};

module.exports = handleInsertTreatment;