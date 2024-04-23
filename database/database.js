//---database.js---//

//Middleware Mongoose
const mongoose = require('mongoose');

//Database YouMind URI:
const dbURI = process.env.MONGO_URI;

//Database MongoDB App Connection 
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

//Export the Database Connection
module.exports = db_YouMind_App;