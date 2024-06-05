const { SQSClient, paginateListQueues } = require("@aws-sdk/client-sqs");

const client = new SQSClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

module.exports = client;