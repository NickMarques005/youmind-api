const Treatment = require('../../models/treatment');
const { PatientUser, DoctorUser } = require('../../models/users');
const mongoose = require('mongoose');


const handleUserChange = async (io, change) => {
    console.log("\n\n***User Change Stream Event: ", change);

    let userModel;
    if (change.ns.coll === 'patient_forms_data') {
        userModel = PatientUser;
    } else if (change.ns.coll === 'doctor_forms_data') {
        userModel = DoctorUser;
    } else {
        return;
    }

    if (change.operationType === 'update') {
        const userId = change.documentKey._id;
        const updatedUser = await userModel.findById(userId);

        if (!updatedUser) {
            console.error('Usuário não encontrado após atualização.');
            return;
        }

        if (change.updateDescription.updatedFields.online !== undefined) {
            const userUid = updatedUser.uid;
            const rooms = await Treatment.find({ $or: [{ patientId: userUid }, { doctorId: userUid }] });
            console.log("Salas encontradas: ", rooms);

            rooms.forEach(room => {
                console.log("Sala especifica: ", room);
                const roomInfo = {
                    userId: updatedUser._id,
                    online: updatedUser.online
                };

                const targetRoom = (room.doctorId === userUid) ? room.patientId : room.doctorId;
                if (!targetRoom) {
                    console.error('Nenhum targetRoom encontrado para emissão.');
                    return;
                }

                console.log("Emitindo status de usuário para a sala: ", targetRoom);
                io.to(targetRoom).emit('userStatusChanged', roomInfo);
            });
        }
    }
}

const userStream = (io) => {
    const patientChangeStream = PatientUser.watch([
        { $match: { 'updateDescription.updatedFields.online': { $exists: true } } }
    ]);

    const doctorChangeStream = DoctorUser.watch([
        { $match: { 'updateDescription.updatedFields.online': { $exists: true } } }
    ]);

    patientChangeStream.on('change', change => handleUserChange(io, change));
    doctorChangeStream.on('change', change => handleUserChange(io, change));
}

module.exports = userStream;