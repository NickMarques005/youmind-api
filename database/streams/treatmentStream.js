const treatment = require('../../models/treatment');
const notificationService = require('../../services/notificationService');
const { getTokenFromFirebase } = require('../../firebase/push_notification/push_notification');
const { PatientUser, DoctorUser } = require('../../models/users');
const MessageTypes = require('../../utils/response/typeResponse');

const handleTreatmentChange = async (io, change) => {
    console.log("Treatment Change Stream Event: ", change);

    if (change.operationType === 'insert') {
        const insertedTreatment = change.fullDocument;
        console.log("(Change Streams) DATA FROM CHANGE STREAM: ", insertedTreatment);
    }
    else if (change.operationType === 'update') {
        if (change.updateDescription.updatedFields.status === 'active') {
            //INICIO DE TRATAMENTO//

            console.log("(change Streams) Tratamento atualizado!!\n");
            const treatmentId = change.documentKey._id;
            const updatedTreatment = await treatment.findById(treatmentId);

            if (!updatedTreatment) {
                console.error('Tratamento não encontrado após atualização.');
                return;
            }

            const patientId = updatedTreatment.patientId;
            const doctorId = updatedTreatment.doctorId;

            const currentPatient = await PatientUser.find({uid: patientId});
            const currentDoctor = await DoctorUser.find({uid: doctorId});

            const treatmentDoctorInfo = {
                avatar: currentPatient.avatar,
                name: currentPatient.name,
                email: currentPatient.email,
                uid: currentPatient.uid,
                phone: currentPatient.phone,
                birth: currentPatient.birth,
                gender: currentPatient.gender,
                online: currentPatient.online,
                _id: updatedTreatment._id
            }

            const treatmentPatientInfo = {
                avatar: currentDoctor.avatar,
                name: currentDoctor.name,
                email: currentDoctor.email,
                uid: currentDoctor.uid,
                phone: currentDoctor.phone,
                birth: currentDoctor.birth,
                gender: currentDoctor.gender,
                online: currentDoctor.online,
                _id: updatedTreatment._id
            }

            console.log("Tratamento atualizado para ativo: ", updatedTreatment);
            console.log("Emitir socket...");
            io.to(patientId).emit('treatmentUpdate', { treatment: treatmentPatientInfo });
            io.to(doctorId).emit('treatmentUpdate', { treatment: treatmentDoctorInfo });

            const notice = {
                message: "Parabéns por iniciar o tratamento! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?",
                type: 'welcome',
                icon: MessageTypes.INFO
            }

            io.to(patientId).emit('welcomeMessage', { notice: notice });
            io.to(doctorId).emit('welcomeMessage', { notice: notice });
        }
    }
    else if (change.operationType === 'delete') {
        console.log("TRATAMENTO DELETADO!");
        const treatmentId = change.documentKey._id.toString();
        console.log(treatmentId);

        //io.to(treatmentId).emit('treatmentDelete', { data: treatmentId });
    }
}

const treatmentStream = (io) => {
    const treatmentChangeStream = treatment.watch();
    treatmentChangeStream.on('change', change => handleTreatmentChange(io, change));
}

module.exports = treatmentStream;