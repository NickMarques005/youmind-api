const { PatientUser, DoctorUser } = require('../../models/users');

const findSender = async (senderId) => {

    const patientUser = await PatientUser.findOne({uid: senderId});
    if (patientUser) {
        const patientMessage = {
            name: patientUser.name,
            email: patientUser.email,
            type: patientUser.type,
            avatar: patientUser.avatar
        }

        return patientMessage;
    }

    const doctorUser = await DoctorUser.findOne({ uid: senderId});
    if (doctorUser) {
        const doctorMessage = {
            name: doctorUser.name,
            email: doctorUser.email,
            type: doctorUser.type,
            avatar: doctorUser.avatar
        }

        return doctorMessage
    }
}

const handleSenderIcon = (type) => {
    switch (type) {
        case 'doctor': 
            return process.env.DEFAULT_SENDER_PATIENT_ICON_URI;
        case 'patient': 
            return process.env.DEFAULT_SENDER_DOCTOR_ICON_URI;
        default:
            console.error("Houve um erro na verificação de sender para escolher o icone: Tipo de usuário inválido ", type);
            return;
    }
}

module.exports = { findSender, handleSenderIcon }