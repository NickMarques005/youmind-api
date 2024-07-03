const medicationHistoryStream = require("./history/medication/historyMedicationStream");
const questionnaireHistoryStream = require("./history/questionnaire/historyQuestionnaireStream");
const medicationStream = require("./medication/medicationStream");
const questionnaireStream = require("./questionnaire/questionnaireStream");
const treatmentStream = require("./treatment/treatmentStream");
const userStream = require("./user/userStream");
const messageStream = require('./chat/messageStream');

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