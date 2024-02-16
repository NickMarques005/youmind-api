//---textUtils.js---//

const removeAccents = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const handleDataText = (value) => removeAccents(value.toLowerCase());

module.exports = { handleDataText };