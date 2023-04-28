const moment = require("moment");
const ServerError = require("../error");

const mssql = require("../dbConnectionMSSQLClass")()
const mysql = require("../dbConnectionClass")
const alimentacionTarifa = {
    guardar: async function ({ tipo, tarifaDesayuno, tarifaAlmuerzo, tarifaCena }, usuarioId) {
        const fechaRegistro = moment().format("YYYY-MM-DD")
        await mssql.insertar("alim_tarifaComida", [{ tipo, tarifaDesayuno, tarifaAlmuerzo, tarifaCena, fechaRegistro }])
    },
    listar: async function () {
        const data = await mssql.ejecutarQueryPreparado(`select * from alim_tarifaComida where activo=1`, {})
        return data
    },
    editar: async function ({ tipo, tarifaDesayuno, tarifaAlmuerzo, tarifaCena, id }) {
        await mssql.actualizar("alim_tarifaComida", { tipo, tarifaDesayuno, tarifaAlmuerzo, tarifaCena }, { id })
    },
    eliminar: async function (id) {
        await mssql.actualizar("alim_tarifaComida", { activo: 0 }, { id })
    }

}
module.exports = alimentacionTarifa;