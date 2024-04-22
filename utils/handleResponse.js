const HandleError = (res, status=400, error="Erro desconhecido", data=undefined) => {
    return res.status(status).json({success: false, error: `(${status}) ${status === 500 ? "Erro interno no servidor" : "Houve um erro"} - ${error}`, ...(data ? {data} : {})});
}

const HandleSuccess = (res, status=200, message=null, data) => {
    return res.status(status).json({success: true, message, data});
}

module.exports = { HandleError, HandleSuccess };