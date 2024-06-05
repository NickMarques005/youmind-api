const { SendMessageCommand, ReceiveMessageCommand, 
        DeleteMessageCommand, paginateListQueues } = require("@aws-sdk/client-sqs");
const client = require('../aws_config');

const listQueues = async () => {
    const paginatedQueues = paginateListQueues({ client }, {});
    const queues = [];

    for await (const page of paginatedQueues) {
        if (page.QueueUrls?.length) {
            queues.push(...page.QueueUrls);
        }
    }

    return queues;
};

const sendMessage = async (queueUrl, messageBody) => {
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(messageBody)
    };
    try {
        const data = await client.send(new SendMessageCommand(params));
        console.log(`Mensagem enviada para a fila SQS: ${queueUrl}`, data.MessageId);
    } catch (error) {
        console.error('Erro ao enviar mensagem para a fila SQS:', error);
    }
};

const receiveMessages = async (queueUrl) => {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
    };

    try {
        const data = await client.send(new ReceiveMessageCommand(params));
        return data.Messages || [];
    } catch (error) {
        console.error('Erro ao receber mensagens da fila SQS:', error);
        return [];
    }
};

const deleteMessage = async (queueUrl, receiptHandle) => {
    const params = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
    };

    try {
        await client.send(new DeleteMessageCommand(params));
        console.log(`Mensagem deletada da fila SQS: ${queueUrl}`);
    } catch (error) {
        console.error('Erro ao deletar mensagem da fila SQS:', error);
    }
};

module.exports = {
    listQueues,
    sendMessage,
    receiveMessages,
    deleteMessage
};



