const Treatment = require('../../../../models/treatment');
const { PatientUser, DoctorUser } = require('../../../../models/users');
const MessageTypes = require('../../../../utils/response/typeResponse');

const handleUpdateTreatment = async (change, io) => {
    const updatedFields = change.updateDescription.updatedFields;
    const treatmentId = change.documentKey._id;
    if (updatedFields.status === 'active') {
        console.log("(change Streams) Tratamento atualizado!!\n");
        const updatedTreatment = await Treatment.findById(treatmentId);

        if (!updatedTreatment) {
            console.error('Tratamento não encontrado após atualização.');
            return;
        }

        const patientId = updatedTreatment.patientId;
        const doctorId = updatedTreatment.doctorId;

        const currentPatient = await PatientUser.findOne({ uid: patientId });
        const currentDoctor = await DoctorUser.findOne({ uid: doctorId });

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
        };

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
        };

        console.log("Tratamento atualizado para ativo: ", updatedTreatment);
        console.log("Emitir socket...");
        io.to(patientId).emit('treatmentUpdate', { treatment: treatmentPatientInfo });
        io.to(doctorId).emit('treatmentUpdate', { treatment: treatmentDoctorInfo });

        const notice = {
            message: "Parabéns por iniciar o tratamento! Gostaria de ver instruções de como funciona o processo de tratamento no YouMind?",
            type: 'welcome',
            icon: MessageTypes.INFO
        };

        io.to(patientId).emit('welcomeMessage', { notice: notice });
        io.to(doctorId).emit('welcomeMessage', { notice: notice });
    }
};

module.exports = handleUpdateTreatment;