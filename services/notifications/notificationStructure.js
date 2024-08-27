const notificationService = require('./notificationService');

class NotificationStructure {
    /**
     * @param {string} title - Título da notificação
     * @param {string} body - Corpo da notificação
     * @param {NotificationContentData} data - Dados de conteúdo da notificação
     */
    constructor(title, body, data = {}, savePushDate = null) {
        this.notificationData = {
            title,
            body,
            data,
            savePushDate,
        };
    }

    /**
     * Envia a notificação para todos os dispositivos do paciente
     * @param {string} patientId - ID do paciente
     * @returns {Promise<boolean>} - Retorna true se a notificação foi enviada com sucesso
     */
    async sendToPatient(patientId) {
        try {
            const notificationSended = await notificationService.sendNotificationToAllDevices(patientId, this.notificationData);
            if (notificationSended) {
                console.log(`Notificação enviada para o paciente ${patientId}`);
            }
            return notificationSended;
        } catch (error) {
            console.error(`Erro ao enviar notificação para o paciente ${patientId}:`, error);
            return false;
        }
    }

    /**
     * Envia a notificação para todos os dispositivos de um usuário genérico
     * @param {string} userId - ID do usuário
     * @returns {Promise<boolean>} - Retorna true se a notificação foi enviada com sucesso
     */
    async sendToUser(userId) {
        try {
            const notificationSended = await notificationService.sendNotificationToAllDevices(userId, this.notificationData);
            if (notificationSended) {
                console.log(`Notificação enviada para o usuário ${userId}`);
            }
            return notificationSended;
        } catch (error) {
            console.error(`Erro ao enviar notificação para o usuário ${userId}:`, error);
            return false;
        }
    }

    /**
     * Retorna os dados da notificação
     * @returns {NotificationData} - Dados da notificação
     */
    getNotificationData() {
        return this.notificationData;
    }
}

module.exports = NotificationStructure;