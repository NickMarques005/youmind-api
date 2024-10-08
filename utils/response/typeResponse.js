const MessageTypes = {
    SUCCESS: 'success',
    EMAIL_SENT: 'email_sent',
    INFO: 'info',
    TREATMENT: 'treatment',
    WARNING: 'warning',
    MEDICATION: 'medication', 
    QUESTIONNAIRE: 'questionnaire',
    FINISH: 'finish',
    COMPLETED: 'completed',
    MENTAL_HEALTH: 'mental_health',
    SUPPORT: 'support',
    MOOD: 'mood',
    SHIELD_LOCK: 'shield_lock',
    SHIELD_UNLOCK: 'shield_unlock',
    NOTEBOOK: 'notebook',
    NOTEBOOK_CHECK: 'notebook_check'
}

const DefaultTypes = {
    SUCCESS: 'success',
    EMAIL_SENT: 'email_sent',
    INFO: 'info',
    TREATMENT: 'treatment',
    WARNING: 'warning',
    MEDICATION: 'medication',
    QUESTIONNAIRE: 'questionnaire',
    FINISH: 'finish',                
    COMPLETED: 'completed',      
    MENTAL_HEALTH: 'mental_health',         
    SUPPORT: 'support',        
    MOOD: 'mood',
    SHIELD_LOCK: 'shield_lock',
    SHIELD_UNLOCK: 'shield_unlock',
    EDIT: 'edit',
    DELETE: 'delete',
    DESCRIPTION: 'description'
}

module.exports = { MessageTypes, DefaultTypes };