const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { initializeChangeStream } = require('../database/changeStreams');

const initializeSocket = (httpServer, dbURI) => {
    const io = new Server(httpServer);

    initializeChangeStream(io);

    io.on('connection', (socket) => {
        console.log("Usuário conectado: ", socket.id);

        socket.on("joinRoom", (room) => {
            socket.join(room);
            console.log(`Usuário ${socket.id} entrou na sala ${room}`);
        });

        socket.on("sendMessage", (socket_new_message) => {
            console.log(`Mensagem ${socket_new_message.content} mandada por ${socket_new_message.sender} para a sala ${socket_new_message.conversationId} `)
            io.to(socket_new_message.conversationId).emit('receiveMessage', socket_new_message);
        } );

        socket.on('disconnect', () => {
            console.log("Usuário desconectado: ", socket.id);
        });
    });
};

module.exports = { initializeSocket };