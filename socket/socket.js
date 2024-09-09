const { Server } = require('socket.io');
const { verifySocketToken } = require('../middlewares/tokenMiddleware');
const Message = require('../models/message');
const { findAndUpdateUserOnlineStatus } = require('../utils/db/db_helpers');
const { formatMessagesContainingMentionedMessages } = require('../services/chat/chatServices');

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
            try {
                const limit = 40;
                const skip = page * limit;
                console.log("**Get Messages...");
                console.log(page);

                const messages = await Message.find({ conversationId: conversationId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean();

                // Formatar mensagens mencionadas
                const formattedMessages = await formatMessagesContainingMentionedMessages(messages);

                io.to(conversationId).emit("messagesLoaded", formattedMessages);
            } catch (err) {
                console.error("Erro ao carregar mensagens: ", err);
                socket.emit("errorLoadingMessages", "Não foi possível carregar mensagens.");
            }
        });

        socket.on("sendMessage", async (newMessage) => {
            console.log(`Mensagem ${newMessage.content} mandada por ${newMessage.sender} para a sala ${newMessage.conversationId} `)

            try {
                const savedMessage = await Message.create({
                    conversationId: newMessage.conversationId,
                    sender: newMessage.sender,
                    senderType: newMessage.senderType,
                    content: newMessage.content,
                    audioUrl: newMessage.audioUrl,
                    duration: newMessage.duration,
                    readBy: [],
                    createdAt: newMessage.createdAt,
                    updatedAt: newMessage.updatedAt,
                    ...(newMessage.mentionedMessageId && { mentionedMessageId: newMessage.mentionedMessageId })
                });

                let updatedMessage = { ...newMessage, _id: savedMessage._id, sending: false };

                if (newMessage.mentionedMessageId) {
                    const formattedMessage = await formatMessagesContainingMentionedMessages([updatedMessage]);
                    updatedMessage = formattedMessage[0];
                }

                io.to(newMessage.conversationId).emit('receiveMessage', { newMessage: updatedMessage, tempId: newMessage._id });
            }
            catch (err) {
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

        socket.on("deleteMessages", async ({ conversationId, messageIds }) => {
            try {
                await Message.deleteMany({ _id: { $in: messageIds } });
                io.to(conversationId).emit("messagesDeleted", messageIds);
            } catch (err) {
                console.error("Erro ao deletar mensagens: ", err);
            }
        });

        socket.on("markMessages", async ({ conversationId, messageIds, isMarked }) => {
            try {
                await Message.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { isMarked: isMarked } }
                );

                const updatedMessages = await Message.find({ _id: { $in: messageIds } }).lean();
                const formattedMessages = await formatMessagesContainingMentionedMessages(updatedMessages);

                io.to(conversationId).emit("messagesMarked", { messages: formattedMessages, isMarked });
            } catch (err) {
                console.error("Erro ao marcar mensagens: ", err);
            }
        });

        socket.on('getMarkedMessages', async ({ conversationId }) => {
            try {
                const markedMessages = await Message.find({ conversationId, isMarked: true }).lean();

                // Formatar mensagens mencionadas
                const formattedMarkedMessages = await formatMessagesContainingMentionedMessages(markedMessages);

                socket.emit('markedMessagesLoaded', formattedMarkedMessages);
            } catch (error) {
                console.error('Erro ao buscar mensagens marcadas:', error);
            }
        });

        socket.on('unmarkAllMessages', async ({ conversationId }) => {
            try {
                const markedMessages = await Message.find({ conversationId, isMarked: true }, '_id');
                if (markedMessages.length > 0) {
                    await Message.updateMany({ conversationId, isMarked: true }, { isMarked: false });

                    socket.emit('allMessagesUnmarked', {
                        messageIds: markedMessages.map(msg => msg._id),
                        isMarked: false
                    });
                }
            } catch (error) {
                console.error('Erro ao desmarcar todas as mensagens:', error);
            }
        });

        socket.on("findMessage", async ({ conversationId, messageId, page }) => {
            try {
                const limit = 40;
                let skip = page * limit;
                let found = false;
                let currentPage = page;
                let foundMessages = [];
        
                console.log(`Buscando a mensagem com ID: ${messageId} na conversa: ${conversationId} a partir da página: ${page}`);
        
                while (!found) {
                    // Buscar as mensagens na página atual
                    const messages = await Message.find({ conversationId })
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean();
                    
                    //Não havendo mais mensagens, finalizar o loop
                    if (messages.length === 0) {
                        break;
                    }
        
                    // Adicionar as mensagens buscadas à lista de mensagens encontradas
                    foundMessages = [...foundMessages, ...messages];
        
                    // Verificação se é a mensagem escolhida
                    const messageFound = messages.find(msg => msg._id.toString() === messageId);
        
                    if (messageFound) {
                        found = true;
                    } else {
                        currentPage++;
                        skip = currentPage * limit;
                    }
                }
        
                if (found) {
                    // Formatação das mensagens mencionadas
                    const formattedMessages = await formatMessagesContainingMentionedMessages(foundMessages);
        
                    socket.emit("messageFound", {
                        messages: formattedMessages,
                        page: currentPage
                    });
                } else {
                    return console.error("Mensagem selecionada não encontrada");
                }
        
            } catch (err) {
                console.error("Erro ao buscar a mensagem: ", err);
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