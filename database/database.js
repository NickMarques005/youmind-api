const mongoose = require('mongoose');

const dbURI = process.env.MONGO_URI;

const db_YouMind_App = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log('Conexão feita com sucesso ao YouMind DB!');

        const dbName = mongoose.connection.db.namespace;
        console.log("DB: ", dbName);
        return;
    }
    catch (err) {
        return err;
    }
}

module.exports = { db_YouMind_App, dbURI };