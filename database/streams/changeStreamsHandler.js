const messageStream = require("./messageStream");
const treatmentStream = require("./treatmentStream");

class ChangeStreamHandler {
    constructor(options) {
        this.io = options.io;
    }

    initializeStreams() {
        if(this.io)
        {
            treatmentStream(this.io);
            messageStream(this.io);
        }
        else{
            console.log("Streams sem a utilização de Socket.io");

        }
        
    }
}

module.exports = ChangeStreamHandler;