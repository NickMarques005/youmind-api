const ScreenTypes = {
    CHAT: 'chat_treatment',
    TREATMENT: 'main_treatment',
    HEALTH_QUESTIONNAIRES: 'main_questions',
    HEALTH_MEDICATIONS: 'main_medication',
    HEALTH_SCHEDULEMEDICATION: 'schedule_medication',
    BLE_MAIN: 'main_ble',
    BLE_CURRENTDEVICE: 'device_data',
    ANALYSIS_CURRENTPATIENT: 'current_patient',
    ANALYSIS_MAIN: 'main_analysis',
    NOTEPAD_MAIN: 'main_notepad',
    NOTEPAD_CURRENTNOTE: 'current_note'
};

const MenuTypes = {
    TRATAMENTO: 'Tratamento',
    PERFIL: 'Perfil',
    ANALISES: 'Análises',
    NOTEPAD: 'Notepad',
    SAÚDE: 'Saúde',
    BLUETOOTH: 'Bluetooth'
};

const PageTypes = {
    SAÚDE: {
        QUESTIONARIOS: 'Questionários',
        MEDICAMENTOS: 'Medicamentos',
        CALL: 'Call'
    },
}

module.exports = { ScreenTypes, MenuTypes, PageTypes };