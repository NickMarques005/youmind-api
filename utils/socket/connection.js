const isUserConnected = (io, room) => {
    // Acesso ao namespace principal do servidor Socket
    const namespace = io.of("/");
    
    // Verifica se a sala está presente no adaptador
    const roomSockets = namespace.adapter.rooms.get(room);

    // Retorna verdadeiro se a sala existir e tiver pelo menos um socket conectado
    return roomSockets && roomSockets.size > 0;
};

const emitEventToUser = async (io, room, socketEvent, data) => {

    if(!io) {
        console.error(`Houve um erro ao emitir dados ao usuário no evento ${socketEvent}: servidor Socket não especifido`);
        return false;
    }
    
    //Emissão dos dados na sala caso usuário esteja conectado
    if (isUserConnected(io, room)) {
        console.log(`Usuário está conectado na sala ${room}. Emitindo evento...`);
        io.to(room).emit(socketEvent, data);
        return true;
    }
    console.log(`Usuário não conectado na sala ${room} do socket`);
    return false;
}

module.exports = { emitEventToUser, isUserConnected };