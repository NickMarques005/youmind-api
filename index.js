//---index.js---//

const express = require('express');
const { createServer } = require('node:http');
const { initializeSocket } = require('./socket/socket');
const { Server } = require('socket.io');
const dotenv = require('dotenv').config();

const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const bodyparser = require('body-parser');
const cors = require('cors');
const app = express();
const http = require('http');
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;


const database = require('./database/database');

initializeSocket(server);

//Firebase server:
const firebaseServer = require('./firebase/firebase_service');

//***************//
//Banco de dados://
//***************//

//Executando funcionalidades do banco de dados: 
database();

app.use(cors());

app.use(express.json());

//***********//
//  Router:  //
//***********//


app.use('/api', require('./routes/main_router'));

app.get('/', (req, res) => {
    res.send("You Mind Server!");
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

