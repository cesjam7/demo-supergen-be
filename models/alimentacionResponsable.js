const moment = require("moment");
const ServerError = require("../error");

const mssql = require("../dbConnectionMSSQLClass")()
const alimentacionResponsable = {
    guardar: async function (alimentacionResponsable, usuarioId) {
        const { usuario } = alimentacionResponsable
        const usuarioRegistrado = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where email='${usuario.email}' `, {}, true)
        if (usuarioRegistrado) {
            throw new ServerError(`Ya se encuentra registrado el usuario `, 400)
        }
        await mssql.insertar("alim_responsable", [{ nombres: alimentacionResponsable.nombres, nroDni: alimentacionResponsable.nroDni, fechaRegistro: moment().format("YYYY-MM-DD"), idUsuario: usuario.idUsuario, email: usuario.email }])
    },
    listar: async function () {
        const data = await mssql.ejecutarQueryPreparado(`select * from alim_responsable where idEstado=1`, {})
        return data.map(d => ({ ...d, usuario: { idUsuario: d.idUsuario, email: d.email } }))
    },
    editar: async function (alimentacionResponsable) {
        const { usuario } = alimentacionResponsable
        const usuarioRegistrado = await mssql.ejecutarQueryPreparado(`select id from alim_responsable where email='${usuario.email}' and id!=${alimentacionResponsable.id} `, {}, true)
        if (usuarioRegistrado) {
            throw new ServerError(`Ya se encuentra registrado el usuario `, 400)
        }
        await mssql.actualizar("alim_responsable", { nombres: alimentacionResponsable.nombres, nroDni: alimentacionResponsable.nroDni, idUsuario: usuario.idUsuario, email: usuario.email }, { id: alimentacionResponsable.id })
    },
    eliminar: async function (alimentacionResponsableId) {

        await mssql.actualizar("alim_responsable", { idEstado: 0 }, { id: alimentacionResponsableId })
    },
    
}
module.exports = alimentacionResponsable;