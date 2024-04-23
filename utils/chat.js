const { PatientUser, DoctorUser } = require('../models/users');

const findSender = async (senderIdId) => {

    const patientUser = await PatientUser.findById(senderIdId);
    if (patientUser) {
        const patientMessage = {
            name: patientUser.name,
            email: patientUser.email,
            type: patientUser.type
        }

        return patientMessage;
    }

    const doctorUser = await DoctorUser.findById(senderIdId);
    if (doctorUser) {
        const doctorMessage = {
            name: doctorUser.name,
            email: doctorUser.email,
            type: doctorUser.type
        }

        return doctorMessage
    }

    return null;
}

module.exports = { findSender }