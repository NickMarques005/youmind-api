const Treatment = require('../../../../models/treatment');
const { PatientUser, DoctorUser } = require('../../../../models/users');
const { handleStartPatientTreatmentServices } = require('../../../../services/treatment/treatmentServices');
const { emitEventToUser } = require('../../../../utils/socket/connection');
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
        const currentDoctor = await DoctorUser.findOne({ uid: doctorId });

        if (currentPatient) {
            currentPatient.welcomeTreatment = true;
            await currentPatient.save();
        }
        if (currentDoctor) {
            currentDoctor.welcomeTreatment = true;
            await currentDoctor.save();
        }

        const treatmentPatientInfo = {
            avatar: currentPatient.avatar,
            name: currentPatient.name,
            email: currentPatient.email,
            uid: currentPatient.uid,
            phone: currentPatient.phone,
            birth: currentPatient.birth,
            gender: currentPatient.gender,
            online: currentPatient.online,
            _id: updatedTreatment._id
        };

        const treatmentDoctorInfo = {
            avatar: currentDoctor.avatar,
            name: currentDoctor.name,
            email: currentDoctor.email,
            uid: currentDoctor.uid,
            phone: currentDoctor.phone,
            birth: currentDoctor.birth,
            gender: currentDoctor.gender,
            online: currentDoctor.online,
            _id: updatedTreatment._id
        };

        await handleStartPatientTreatmentServices(patientId);

        console.log("Tratamento atualizado para ativo: ", updatedTreatment);
        console.log("Emitir socket...");

        const messagePatient = `Parabéns por iniciar o tratamento com ${treatmentDoctorInfo.name}! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;
        const messageDoctor = `Parabéns por iniciar o tratamento com ${treatmentPatientInfo.name}! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?`;

        const noticePatient = createNotice({ message: messagePatient, type: "welcome", dontshow: true, acceptText: "Sim", declineText: "Não, Obrigado" });
        const noticeDoctor = createNotice({ message: messageDoctor, type: "welcome", dontshow: true, acceptText: "Sim", declineText: "Não, Obrigado" });

        await emitEventToUser(io, patientId, 'treatmentInitiate', { treatment: updatedTreatment, notice: noticePatient });
        await emitEventToUser(io, doctorId, 'treatmentInitiate', { treatment: updatedTreatment, notice: noticeDoctor });

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
        const currentDoctor = await DoctorUser.findOne({ uid: doctorId });

        if (currentPatient) {
            currentPatient.welcomeTreatment = false;
            await currentPatient.save();
        }
        if (currentDoctor) {
            currentDoctor.welcomeTreatment = false;
            await currentDoctor.save();
        }

        const treatmentPatientInfo = {
            avatar: currentPatient.avatar,
            name: currentPatient.name,
            email: currentPatient.email,
            uid: currentPatient.uid,
            phone: currentPatient.phone,
            birth: currentPatient.birth,
            gender: currentPatient.gender,
            online: currentPatient.online,
            _id: updatedTreatment._id
        };

        const treatmentDoctorInfo = {
            avatar: currentDoctor.avatar,
            name: currentDoctor.name,
            email: currentDoctor.email,
            uid: currentDoctor.uid,
            phone: currentDoctor.phone,
            birth: currentDoctor.birth,
            gender: currentDoctor.gender,
            online: currentDoctor.online,
            _id: updatedTreatment._id
        };

        const messagePatient = `Parabéns por completar o tratamento com ${treatmentDoctorInfo.name}!`;
        const messageDoctor = `Parabéns por completar o tratamento com ${treatmentPatientInfo.name}!`;

        const noticePatient = createNotice({ message: messagePatient, type: "treatment_end", dontshow: true, acceptText: "Ok" });
        const noticeDoctor = createNotice({ message: messageDoctor, type: "treatment_end", dontshow: true, acceptText: "Ok" });

        await emitEventToUser(io, patientId, 'treatmentComplete', { treatment: updatedTreatment, notice: noticePatient });
        await emitEventToUser(io, doctorId, 'treatmentComplete', { treatment: updatedTreatment, notice: noticeDoctor });

        console.log("Tratamento concluído e Notice enviado...");
    }
};

module.exports = handleUpdateTreatment;