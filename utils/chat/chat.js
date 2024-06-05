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

module.exports = { findSender }