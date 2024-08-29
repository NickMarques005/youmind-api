const { Server } = require('socket.io');
const { verifySocketToken } = require('../middlewares/tokenMiddleware');
const Message = require('../models/message');
const { findAndUpdateUserOnlineStatus } = require('../utils/db/db_helpers');

let io; //Instância para o socket server

const initializeSocket = (httpServer, dbURI) => {
    io = new Server(httpServer);

    io.use(verifySocketToken);

    io.on('connection', (socket) => {
        console.log("Usuário conectado: ", socket.id);

        socket.on("joinRoom", async ({ room, userId }) => {
            socket.join(room);
            socket.userId = userId;
            console.log("Socket uid salvo: ", socket.userId);
            console.log(`Usuário ${socket.id} entrou na sala ${room}`);
            console.log("UserId: ", userId);
            const rooms = Array.from(socket.rooms);
            console.log("Quantidade de salas: ", rooms);
            if (userId) {
                console.log("First room");
                await findAndUpdateUserOnlineStatus(userId, true);
            }
        });

        socket.on("leaveRoom", async ({ room, userId }) => {
            socket.leave(room);
            console.log(`Usuário ${socket.id} saiu da sala ${room}`);
            console.log("UserId: ", userId);
            const rooms = Array.from(socket.rooms);
            console.log("Quantidade de salas: ", rooms);
            if (userId) {
                console.log("Last Room");
                await findAndUpdateUserOnlineStatus(userId, false);
            }
        });

        socket.on("getMessages", async ({ conversationId, page }) => {
            const limit = 20;
            const skip = page * limit;
            console.log("**Get Messages...");
            console.log(page);

            try {
                const messages = await Message.find({ conversationId: conversationId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit);

                console.log("Mensagens: ", messages);

                io.to(conversationId).emit("messagesLoaded", messages);
            } catch (err) {
                console.error("Erro ao carregar mensagens: ", err);
                socket.emit("errorLoadingMessages", "Não foi possível carregar mensagens.");
            }
        });

        socket.on("sendMessage", async (newMessage) => {
            console.log(`Mensagem ${newMessage.content} mandada por ${newMessage.sender} para a sala ${newMessage.conversationId} `)
            
            try{
                const savedMessage = await Message.create({
                    conversationId: newMessage.conversationId,
                    sender: newMessage.sender,
                    content: newMessage.content,
                    audioUrl: newMessage.audioUrl,
                    duration: newMessage.duration,
                    readBy: [],
                    createdAt: newMessage.createdAt,
                    updatedAt: newMessage.updatedAt,
                });

                const updatedMessage = { ...newMessage, _id: savedMessage._id, sending: false };
                io.to(newMessage.conversationId).emit('receiveMessage', { newMessage: updatedMessage, tempId: newMessage._id });
            }
            catch (err)
            {
                console.error("Erro ao salvar mensagem: ", err);
            }
        });

        socket.on("messageRead", async ({ message, userId }) => {
            try {
                console.log("Mensagem visualizada: ", message._id);
                console.log("Pelo usuário: ", userId);
                await Message.updateOne({ _id: message._id }, { $addToSet: { readBy: userId } });
                io.to(message.conversationId).emit("updateMessageStatus", { messageId: message._id, userId });
            } catch (err) {
                console.error("Erro ao marcar mensagem como lida: ", err);
            }
        });

        socket.on('disconnect', async () => {
            console.log("Usuário desconectado: ", socket.id);

            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.leave(room);
                    console.log(`Usuário ${socket.id} foi removido da sala ${room} após desconectar`);
                }
            });

            if (socket.userId) {
                console.log(`Atualizando status para offline: UserId ${socket.userId}`);
                await findAndUpdateUserOnlineStatus(socket.userId, false);
            }
        });
    });
};

const getSocketServer = () => {
    return io || null;
}

module.exports = { initializeSocket, getSocketServer };