const isUserConnected = (io, room) => {
    const sockets = io.of("/").adapter.rooms.get(room);
    return sockets && sockets.size > 0;
};

const emitEventToUser = async (io, room, socketEvent, data) => {
    if (isUserConnected(io, room)) {
        console.log(`Usuário está conectado na sala ${room}. Emitindo evento...`);
        io.to(room).emit(socketEvent, data);
        return true;
    }
    console.log(`Usuário não conectado na sala ${room} do socket`);
    return false;
}

module.exports = { emitEventToUser, isUserConnected };