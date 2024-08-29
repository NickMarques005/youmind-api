const express = require('express');
const http = require('http');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { createServer } = require('node:http');
const bodyparser = require('body-parser');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);

const { dbURI, db_YouMind_App } = require('./database/database');
const { initializeDatabaseServices } = require('./database/initializeDatabaseServices');

//Firebase server:

const firebaseApp = require('./firebase/firebase_config');


//***************//
//Banco de dados://
//***************//

//Executando funcionalidades do banco de dados: 
db_YouMind_App().then(async () => {
    await initializeDatabaseServices(server, dbURI);
}).catch((err) => {
    console.error("Conexão com o database falhou: ", err);
});

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