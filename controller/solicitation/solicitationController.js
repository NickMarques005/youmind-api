const { PatientUser, DoctorUser } = require('../../models/users');
const { HandleError, HandleSuccess } = require('../../utils/response/handleResponse');
const TreatmentRequest = require('../../models/solicitation_treatment');
const { solicitationTypes } = require('../../utils/solicitation/solicitation');
const { handleTreatmentSolicitation } = require('../../services/solicitation/solicitationTreatment');

exports.createSolicitation = async (req, res) => {
    const { uid } = req.user;
    const { receiver_id, type, solicitationType } = req.body;

    if (!uid) return HandleError(res, 401, "Usuário não autorizado");

    try {
        const ModelRequester = type === "patient" ? PatientUser : DoctorUser;
        const ModelReceiver = type === "patient" ? DoctorUser : PatientUser;
        const fieldRequesterId = type === "patient" ? "patientId" : "doctorId";
        const fieldReceiverId = type === "patient" ? "doctorId" : "patientId";

        const [requester, receiver] = await Promise.all([
            ModelRequester.findOne({ uid: uid }),
            ModelReceiver.findOne({ _id: receiver_id })
        ]);
        if (!requester) return HandleError(res, 404, "Seu usuário não foi encontrado em nosso banco de dados.");
        if (!receiver) return HandleError(res, 404, "Usuário não encontrado. Envie a solicitação novamente");


        if (!Object.values(solicitationTypes).includes(solicitationType)) {
            return HandleError(res, 400, "Tipo de solicitação inválido");
        }

        switch (solicitationType) {
            case solicitationTypes.TREATMENT:
                return handleTreatmentSolicitation({ 
                    req, res, requester, receiver, 
                    fieldRequesterId, fieldReceiverId,
                    solicitationType
                });
            default:
                return HandleError(res, 400, "Tipo de solicitação não suportado");
        }
    } catch (err) {
        return HandleError(res, 500, "Erro em registrar Push Notification", err);
    }
};

exports.declineSolicitation = async (req, res) => {
    const { solicitationId, solicitationType } = req.body;
    const { uid } = req.user;

    if (!uid) return HandleError(res, 401, "Usuário não autorizado");

    try {

        if (!Object.values(solicitationTypes).includes(solicitationType)) {
            return HandleError(res, 400, "Tipo de solicitação inválido");
        }

        const solicitation = await TreatmentRequest.findOneAndDelete({
            _id: solicitationId,
            $or: [{ doctorId: uid }, { patientId: uid }]
        });

        if (!solicitation) return HandleError(res, 404, "Solicitação não encontrada ou já excluída");

        return HandleSuccess(res, 200, "Solicitação recusada");
    } catch (err) {
        return HandleError(res, 500, "Erro ao recusar e excluir solicitação", err);
    }
};