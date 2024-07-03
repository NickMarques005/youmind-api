const Treatment = require('../../../../models/treatment');

const handleUpdateUser = async (change, io) => {
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
};

module.exports = handleUpdateUser;