const ChangeStreamsHandler = require('./changeStreamsHandler');

const initializeChangeStreams = ({ io }) => {
    const streamsHandler = new ChangeStreamsHandler({ io });
    streamsHandler.initializeStreams();
}

module.exports = { initializeChangeStreams };