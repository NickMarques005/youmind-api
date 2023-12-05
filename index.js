//---index.js---//

const express = require('express');
const { createServer } = require('node:http');
const { initializeSocket } = require('./socket/socket');
const { Server } = require('socket.io');
const dotenv = require('dotenv').config();

const bodyparser = require('body-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

const database = require('./database/database');

initializeSocket(server);
//Firebase server:
const firebaseServer = require('./firebase/firebase_service');

//Executando funcionalidades do banco de dados: 
database();
app.use(express.json());

//***************//
//Banco de dados://
//***************//


//**********//
//  Rotas:  //
//**********//


// NOTIFICAÇÕES:

app.use('/api', require('./routes/notifications_route'));

//Rotas para FRONTEND: 

//--> CRIAÇÃO DE USUÁRIO E AUTENTICAÇÃO:

app.use('/api', require('./routes/createUser'));

app.use('/api', require('./routes/loginUser'));

app.use('/api', require('./routes/userData'));

app.use('/api', require('./routes/filterUsers'));

//--> TRATAMENTO 

app.use('/api', require('./routes/treatment_route'));

//--> CONVERSAS E MENSAGENS 

app.use('/api', require("./routes/conversation_routes"));

//--> ANOTAÇÕES

app.use('/api', require('./routes/notepad_routes'));

app.get('/', (req, res) => {
    res.send("You Mind Server!");
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

