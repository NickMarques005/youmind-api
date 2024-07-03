const messageStream = require("./chat/messageStream");
const treatmentStream = require("./treatmentStream");
const userStream = require("./userStream");
const questionnaireStream = require('./questionnaireStream');
const medicationStream = require('./medication/medicationStream');
const questionnaireHistoryStream = require("./historyQuestionnaireStream");
const medicationHistoryStream = require("./history/medication/historyMedicationStream");
class ChangeStreamHandler {
    constructor(options) {
        this.io = options.io;
    }

    initializeStreams() {
        if(this.io)
        {
            treatmentStream(this.io);
            messageStream(this.io);
            userStream(this.io);
            questionnaireStream(this.io);
            medicationStream(this.io);
            questionnaireHistoryStream(this.io);
            medicationHistoryStream(this.io);
        }
        else{
            console.log("Streams sem a utilização de Socket.io");
        }
    }
}

module.exports = ChangeStreamHandler;