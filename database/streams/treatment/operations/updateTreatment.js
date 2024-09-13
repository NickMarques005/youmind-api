const Treatment = require('../../../../models/treatment');
const { PatientUser, DoctorUser } = require('../../../../models/users');
const { formatTreatment } = require('../../../../services/treatment/treatmentFormatting');
const { handleStartPatientTreatmentServices } = require('../../../../services/treatment/treatmentServices');
const { emitTreatmentInitiate, emitTreatmentComplete } = require('../../../../socket/events/treatmentEvents');
const { createNotice } = require('../../../../utils/user/notice');

const handleUpdateTreatment = async (change, io) => {
    const updatedFields = change.updateDescription.updatedFields;
    const treatmentId = change.documentKey._id;
    if (updatedFields.status === 'active') {
        console.log("(change Streams) Tratamento atualizado para ATIVO!!\n");
        const updatedTreatment = await Treatment.findById(treatmentId);

        if (!updatedTreatment) {
            console.error('Tratamento não encontrado após atualização.');
            return;
        }

        const patientId = updatedTreatment.patientId;
        const doctorId = updatedTreatment.doctorId;

        const currentPatient = await PatientUser.findOne({ uid: patientId });
        if (!currentPatient) return console.error("Houve um erro: Usuário paciente não encontrado após tratamento ficar ativo!");
        const currentDoctor = await DoctorUser.findOne({ uid: doctorId });
        if (!currentDoctor) return console.error("Houve um erro: Usuário médico não encontrado após tratamento ficar ativo!");

        if (currentPatient) {
            currentPatient.welcomeTreatment = true;
            await currentPatient.save();
        }
        if (currentDoctor) {
            currentDoctor.welcomeTreatment = true;
            await currentDoctor.save();
        }

        //Ajuste para que os tratamentos sejam entregues no formato correto ****
        const treatmentPatientInfo = await formatTreatment(updatedTreatment, currentPatient.type, patientId);
        const treatmentDoctorInfo = await formatTreatment(updatedTreatment, currentDoctor.type, doctorId);
        if (!treatmentPatientInfo || !treatmentDoctorInfo) return console.error('Erro ao formatar tratamento.');

        await handleStartPatientTreatmentServices(patientId);

        console.log("Tratamento atualizado para ativo: ", updatedTreatment);
        console.log("Emitir socket...");

        const messagePatient = `Parabéns por iniciar o tratamento com ${treatmentPatientInfo.name}! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;
        const messageDoctor = `Parabéns por iniciar o tratamento com ${treatmentDoctorInfo.name}! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;

        const noticePatient = createNotice({ message: messagePatient, type: "welcome", dontshow: true, acceptText: "Sim", declineText: "Não, Obrigado" });
        const noticeDoctor = createNotice({ message: messageDoctor, type: "welcome", dontshow: true, acceptText: "Sim", declineText: "Não, Obrigado" });

        const patientInfo = {
            patientId,
            treatment: treatmentPatientInfo,
            notice: noticePatient,
            is_treatment_running: true
        }

        const doctorInfo = {
            doctorId,
            treatment: treatmentDoctorInfo,
            notice: noticeDoctor
        }

        await emitTreatmentInitiate({ io, patientInfo, doctorInfo });

        console.log("Tratamento e Notice mandado...");
    }
    else if (updatedFields.status === 'completed') {
        console.log("(change Streams) Tratamento atualizado para ENCERRADO!!\n");
        const updatedTreatment = await Treatment.findById(treatmentId);

        if (!updatedTreatment) {
            console.error('Tratamento não encontrado após atualização.');
            return;
        }

        const patientId = updatedTreatment.patientId;
        const doctorId = updatedTreatment.doctorId;

        const currentPatient = await PatientUser.findOne({ uid: patientId });
        if (!currentPatient) return console.error("Houve um erro: Usuário paciente não encontrado após tratamento ficar ativo!");
        const currentDoctor = await DoctorUser.findOne({ uid: doctorId });
        if (!currentDoctor) return console.error("Houve um erro: Usuário médico não encontrado após tratamento ficar ativo!");


        if (currentPatient) {
            currentPatient.welcomeTreatment = false;
            await currentPatient.save();
        }
        if (currentDoctor) {
            /*
            ### Retirar o doctorId do tratamento:
            */
            updatedTreatment.doctorId = undefined;
            await updatedTreatment.save();

            currentDoctor.welcomeTreatment = false;
            await currentDoctor.save();
        }

        /*
        ### Atualização do tratamento para os usuários paciente e doutor:
        */

        //Ajuste para que os tratamentos sejam entregues no formato correto ****
        const treatmentPatientInfo = await formatTreatment(updatedTreatment, currentPatient.type, patientId);
        const treatmentDoctorInfo = await formatTreatment(updatedTreatment, currentDoctor.type, doctorId);
        if (!treatmentPatientInfo || !treatmentDoctorInfo) return console.error('Erro ao formatar tratamento.');

        const messagePatient = `Parabéns por completar o tratamento com ${treatmentPatientInfo.name}!`;
        const messageDoctor = `Parabéns por completar o tratamento com ${treatmentDoctorInfo.name}!`;

        const noticePatient = createNotice({ message: messagePatient, type: "treatment_end", dontshow: true, acceptText: "Ok" });
        const noticeDoctor = createNotice({ message: messageDoctor, type: "treatment_end", dontshow: true, acceptText: "Ok" });

        const patientInfo = {
            patientId,
            treatment: treatmentPatientInfo,
            notice: noticePatient,
            is_treatment_running: false
        }

        const doctorInfo = {
            doctorId,
            treatment: treatmentDoctorInfo,
            notice: noticeDoctor
        }

        await emitTreatmentComplete({ io, patientInfo, doctorInfo });
        console.log("Tratamento concluído e Notice enviado...");
    }
};

module.exports = handleUpdateTreatment;