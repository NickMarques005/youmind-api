
/*
### Função que irá iterar sobre tasks para cancelar uma task por vez
*/

const cancelSpecificTask = async (taskId, agenda) => {
    if(!agenda) return console.error("Erro ao cancelar tarefa de agendamento: agenda não foi definida");
    
    await agenda.cancel({ _id: taskId });
}

const cancelTasks = (tasks, agenda) => {

}

module.exports = { 
    cancelSpecificTask,
    cancelTasks
};